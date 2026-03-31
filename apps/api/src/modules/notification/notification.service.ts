import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { NotificationGateway } from "./notification.gateway";
import { NotificationResponseDto } from "./dto/notification-response.dto";

const NOTIFICATION_EXPIRY_DAYS = 30;

export interface CreateNotificationInput {
  userId: string;
  type: string;
  channel: "PUSH" | "SMS" | "EMAIL" | "IN_APP";
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  actionUrl?: string | null;
  scheduledFor?: Date | null;
}

export type NotificationType =
  | "BID_PLACED"
  | "BID_OUTBID"
  | "AUCTION_WON"
  | "AUCTION_ENDED"
  | "ORDER_CREATED"
  | "ORDER_DELIVERED"
  | "COD_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "DISPUTE_OPENED"
  | "REVIEW_RECEIVED"
  | "BROADCAST_RECEIVED"
  | "SYSTEM_ANNOUNCEMENT";

const CRITICAL_TYPES: string[] = [
  "DISPUTE_OPENED",
  "COD_CONFIRMED",
  "PAYMENT_RECEIVED",
];

const URGENT_TYPES: string[] = [
  "BID_OUTBID",
  "AUCTION_WON",
  "ORDER_CREATED",
];

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationResponseDto> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRY_DAYS);

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as any,
        channel: input.channel as any,
        title: input.title,
        body: input.body,
        data: (input.data as any) || undefined,
        actionUrl: input.actionUrl,
        sent: true,
        sentAt: new Date(),
        delivered: input.channel === "IN_APP",
        deliveredAt: input.channel === "IN_APP" ? new Date() : null,
        scheduledFor: input.scheduledFor,
      },
    });

    if (input.channel === "IN_APP") {
      this.notificationGateway.sendToUser(input.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data as Record<string, unknown> | null,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
        read: notification.read,
      });
    }

    if (CRITICAL_TYPES.includes(input.type)) {
      await this.sendSmsStub(input.userId, input.title, input.body);
    }

    if (input.channel === "PUSH" || CRITICAL_TYPES.includes(input.type)) {
      await this.sendPushStub(input.userId, input.title, input.body, input.data);
    }

    this.logger.log(
      `Notification ${notification.id} created for ${input.userId}: ${input.type}`,
    );

    return this.mapToResponse(notification);
  }

  async getNotifications(
    userId: string,
    limit: number,
    cursor?: string,
    unreadOnly: boolean = false,
  ): Promise<{
    data: NotificationResponseDto[];
    meta: { total: number; hasMore: boolean; cursor: string | null };
  }> {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const take = Math.min(limit, 100);

    const notifications = await this.prisma.notification.findMany({
      where,
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const hasMore = notifications.length > take;
    if (hasMore) {
      notifications.pop();
    }

    const total = await this.prisma.notification.count({ where });
    const nextCursor =
      hasMore && notifications.length > 0
        ? notifications[notifications.length - 1].id
        : null;

    this.cleanExpiredNotifications(userId);

    return {
      data: notifications.map((n) => this.mapToResponse(n)),
      meta: {
        total,
        hasMore,
        cursor: nextCursor,
      },
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new HttpException("Notification not found", HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return this.mapToResponse(updated);
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for ${userId}`);

    return {
      success: true,
      count: result.count,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }

  async trackClick(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        clicked: true,
        clickedAt: new Date(),
      },
    });
  }

  private async sendPushStub(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        metadata: true,
      },
    });

    if (!user?.metadata) {
      return;
    }

    const metadata = user.metadata as Record<string, unknown>;
    const fcmToken = metadata.fcmToken as string | undefined;

    if (!fcmToken) {
      return;
    }

    const payload = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    this.logger.log(`[FCM Stub] Push notification for ${userId}: ${title}`);
    this.logger.debug(`[FCM Stub] Payload: ${JSON.stringify(payload)}`);
  }

  private async sendSmsStub(
    userId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      return;
    }

    this.logger.log(
      `[SMS Stub] SMS to ${user.phone} for ${userId}: ${title}`,
    );
  }

  private async cleanExpiredNotifications(userId: string): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_EXPIRY_DAYS);

    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoff,
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Cleaned ${result.count} expired notifications for ${userId}`,
      );
    }
  }

  private mapToResponse(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | null,
      actionUrl: notification.actionUrl,
      read: notification.read,
      readAt: notification.readAt,
      clicked: notification.clicked,
      clickedAt: notification.clickedAt,
      sent: notification.sent,
      sentAt: notification.sentAt,
      delivered: notification.delivered,
      deliveredAt: notification.deliveredAt,
      createdAt: notification.createdAt,
    };
  }
}
