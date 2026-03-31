import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { TrustService } from "../trust/trust.service";
import { NotificationService } from "../notification/notification.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewResponseDto, ReviewerInfoDto } from "./dto/review-response.dto";
import { Prisma } from "@prisma/client";

const ALLOWED_TAGS = [
  "accurate_description",
  "good_communication",
  "on_time",
  "fair_price",
  "responsive",
];

const REVIEW_WINDOW_DAYS = 7;
const EDIT_WINDOW_HOURS = 24;

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly trustService: TrustService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const existing = await this.prisma.review.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existing) {
      throw new HttpException(
        "A review already exists for this order",
        HttpStatus.CONFLICT,
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!order) {
      throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== reviewerId) {
      throw new HttpException(
        "Only the buyer who completed the order can submit a review",
        HttpStatus.FORBIDDEN,
      );
    }

    if (order.sellerId !== dto.targetId) {
      throw new HttpException(
        "Target user must be the seller of this order",
        HttpStatus.BAD_REQUEST,
      );
    }

    const deliverableStatuses = ["DELIVERED", "PAID"];
    if (!deliverableStatuses.includes(order.status)) {
      throw new HttpException(
        "Can only review orders that have been delivered",
        HttpStatus.BAD_REQUEST,
      );
    }

    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery =
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDelivery > REVIEW_WINDOW_DAYS) {
      throw new HttpException(
        `Review window expired. Reviews must be submitted within ${REVIEW_WINDOW_DAYS} days of delivery`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const validatedTags = dto.tags
      ? dto.tags.filter((tag) => ALLOWED_TAGS.includes(tag))
      : [];

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        reviewerId,
        targetId: dto.targetId,
        rating: dto.rating,
        tags: validatedTags.length > 0 ? (validatedTags as any) : Prisma.JsonNull,
        comment: dto.comment,
        isVerified: true,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
          },
        },
      },
    });

    const isCollusion = await this.detectCollusion(dto.targetId);
    if (isCollusion) {
      await this.prisma.review.update({
        where: { id: review.id },
        data: { flagged: true, flaggedReason: "Potential collusion detected" },
      });

      this.logger.warn(
        `Potential collusion detected in review ${review.id} for target ${dto.targetId}`,
      );
    }

    await this.trustService.onReviewSubmitted(dto.targetId);

    await this.notificationService.create({
      userId: dto.targetId,
      type: "REVIEW_RECEIVED",
      channel: "IN_APP",
      title: "New Review Received",
      body: `You received a ${dto.rating}-star review from a buyer`,
      data: {
        reviewId: review.id,
        orderId: dto.orderId,
        rating: dto.rating,
      },
    });

    this.logger.log(
      `Review ${review.id} created: ${reviewerId} -> ${dto.targetId}, rating: ${dto.rating}`,
    );

    return this.mapToResponse(review);
  }

  async getReceivedReviews(targetId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        targetId,
        flagged: false,
        isPublic: true,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews.map((r) => this.mapToResponse(r));
  }

  async getGivenReviews(reviewerId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { reviewerId },
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews.map((r) => this.mapToResponse(r));
  }

  async update(
    reviewId: string,
    userId: string,
    dto: Partial<CreateReviewDto>,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
          },
        },
      },
    });

    if (!review) {
      throw new HttpException("Review not found", HttpStatus.NOT_FOUND);
    }

    if (review.reviewerId !== userId) {
      throw new HttpException(
        "You can only edit your own reviews",
        HttpStatus.FORBIDDEN,
      );
    }

    const hoursSinceCreation =
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
      throw new HttpException(
        `Edit window expired. Reviews can only be edited within ${EDIT_WINDOW_HOURS} hours`,
        HttpStatus.FORBIDDEN,
      );
    }

    const updateData: Record<string, unknown> = {};

    if (dto.rating !== undefined) {
      updateData.rating = dto.rating;
    }

    if (dto.tags !== undefined) {
      const validatedTags = dto.tags.filter((tag) =>
        ALLOWED_TAGS.includes(tag),
      );
      updateData.tags =
        validatedTags.length > 0 ? JSON.stringify(validatedTags) : null;
    }

    if (dto.comment !== undefined) {
      updateData.comment = dto.comment;
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            role: true,
          },
        },
      },
    });

    await this.trustService.onReviewSubmitted(review.targetId);

    this.logger.log(`Review ${reviewId} updated by ${userId}`);

    return this.mapToResponse(updated);
  }

  async detectCollusion(targetId: string): Promise<boolean> {
    const fiveStarReviews = await this.prisma.review.findMany({
      where: {
        targetId,
        rating: 5,
        flagged: false,
      },
      select: { reviewerId: true },
    });

    if (fiveStarReviews.length < 2) {
      return false;
    }

    const reviewerIds = fiveStarReviews.map((r) => r.reviewerId);

    const crossReviews = await this.prisma.review.findMany({
      where: {
        reviewerId: { in: reviewerIds },
        targetId: { in: reviewerIds },
        rating: 5,
        flagged: false,
      },
    });

    return crossReviews.length > 0;
  }

  private mapToResponse(review: any): ReviewResponseDto {
    return {
      id: review.id,
      orderId: review.orderId,
      reviewerId: review.reviewerId,
      targetId: review.targetId,
      rating: review.rating,
      tags: review.tags ? JSON.parse(review.tags) : null,
      comment: review.comment,
      isPublic: review.isPublic,
      isVerified: review.isVerified,
      flagged: review.flagged,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reviewer: {
        id: review.reviewer.id,
        displayName: review.reviewer.displayName,
        avatarUrl: review.reviewer.avatarUrl,
        trustScore: review.reviewer.trustScore,
        role: review.reviewer.role,
      } as ReviewerInfoDto,
    };
  }
}
