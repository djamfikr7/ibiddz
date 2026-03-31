import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { ReviewService } from "./review.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewResponseDto } from "./dto/review-response.dto";
import { JwtGuard } from "../auth/jwt.guard";
import { CurrentUser, RequestUser } from "../../common/decorators/user.decorator";

@ApiTags("reviews")
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller("v1/reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: "Submit a review (post-delivery, within 7 days)" })
  @ApiResponse({
    status: 201,
    description: "Review submitted successfully",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input or not eligible" })
  @ApiResponse({ status: 409, description: "Review already exists for this order" })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.create(user.id, dto);
  }

  @Get("user/:id")
  @ApiOperation({ summary: "Get reviews received by a user" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Reviews retrieved",
    type: [ReviewResponseDto],
  })
  async getUserReviews(
    @Param("id") targetId: string,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewService.getReceivedReviews(targetId);
  }

  @Get("my")
  @ApiOperation({ summary: "Get reviews given by current user" })
  @ApiResponse({
    status: 200,
    description: "Reviews retrieved",
    type: [ReviewResponseDto],
  })
  async getMyReviews(
    @CurrentUser() user: RequestUser,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewService.getGivenReviews(user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a review (within 24h of creation)" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review updated successfully",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 403, description: "Not authorized or edit window expired" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateReviewDto>,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.update(id, user.id, dto);
  }
}
