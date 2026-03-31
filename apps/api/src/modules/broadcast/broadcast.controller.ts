import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
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
import { BroadcastService } from "./broadcast.service";
import { CreateBroadcastDto } from "./dto/create-broadcast.dto";
import { BroadcastResponseDto } from "./dto/broadcast-response.dto";
import { JwtGuard } from "../auth/jwt.guard";
import { CurrentUser, RequestUser } from "../../common/decorators/user.decorator";

@ApiTags("broadcasts")
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller("v1/broadcasts")
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Post()
  @ApiOperation({ summary: "Schedule a broadcast (uses credits)" })
  @ApiResponse({
    status: 201,
    description: "Broadcast scheduled successfully",
    type: BroadcastResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 402, description: "Insufficient credits" })
  @ApiResponse({ status: 429, description: "Rate limit exceeded" })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBroadcastDto,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastService.create(user.id, dto);
  }

  @Get("my")
  @ApiOperation({ summary: "Get user's broadcast history" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Broadcast history retrieved",
  })
  async getMyBroadcasts(
    @CurrentUser() user: RequestUser,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    return this.broadcastService.getMyBroadcasts(
      user.id,
      limit || 20,
      cursor,
    );
  }

  @Get(":id/analytics")
  @ApiOperation({ summary: "Get delivery analytics for a broadcast" })
  @ApiParam({ name: "id", description: "Broadcast ID" })
  @ApiResponse({
    status: 200,
    description: "Analytics retrieved",
    type: BroadcastResponseDto,
  })
  @ApiResponse({ status: 404, description: "Broadcast not found" })
  async getAnalytics(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastService.getAnalytics(id, user.id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a queued broadcast" })
  @ApiParam({ name: "id", description: "Broadcast ID" })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: "Broadcast cancelled successfully",
  })
  @ApiResponse({ status: 400, description: "Cannot cancel this broadcast" })
  @ApiResponse({ status: 404, description: "Broadcast not found" })
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.broadcastService.cancel(id, user.id);
  }
}
