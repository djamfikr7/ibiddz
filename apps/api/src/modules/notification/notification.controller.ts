import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
  ApiQuery,
} from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { NotificationResponseDto } from "./dto/notification-response.dto";
import { JwtGuard } from "../auth/jwt.guard";
import { CurrentUser, RequestUser } from "../../common/decorators/user.decorator";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller("v1/notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Get user's notifications (paginated)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiQuery({ name: "unreadOnly", required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved",
  })
  async getNotifications(
    @CurrentUser() user: RequestUser,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    return this.notificationService.getNotifications(
      user.id,
      limit || 20,
      cursor,
      unreadOnly === "true",
    );
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: "Notification marked as read",
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read",
  })
  async markAllAsRead(
    @CurrentUser() user: RequestUser,
  ): Promise<{ success: boolean; count: number }> {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({
    status: 200,
    description: "Unread count retrieved",
  })
  async getUnreadCount(
    @CurrentUser() user: RequestUser,
  ): Promise<{ count: number }> {
    return this.notificationService.getUnreadCount(user.id);
  }
}
