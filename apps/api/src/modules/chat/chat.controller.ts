import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { ChatService } from './chat.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CurrentUser, RequestUser } from '../../common/decorators/user.decorator'
import { SendMessageDto } from './dto/send-message.dto'

@ApiTags('chat')
@Controller('v1/chat')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getConversations(@CurrentUser() user: RequestUser) {
    return this.chatService.getConversations(user.id)
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation detail' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation detail retrieved' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationDetail(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversationDetail(id, user.id)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get message history' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page', type: Number })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(id, user.id, cursor, limit ? parseInt(limit.toString(), 10) : 50)
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid message data' })
  @ApiResponse({ status: 403, description: 'Access denied or blocked' })
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      id,
      user.id,
      dto.content,
      dto.type || 'TEXT',
      dto.imageUrl,
    )
  }

  @Post('conversations/:id/block')
  @ApiOperation({ summary: 'Block user in conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid block request' })
  async blockUser(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { blockedId: string },
  ) {
    return this.chatService.blockUser(user.id, body.blockedId, id)
  }

  @Post('conversations/:id/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  async unblockUser(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { blockedId: string },
  ) {
    return this.chatService.unblockUser(user.id, body.blockedId)
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create or get existing conversation' })
  @ApiResponse({ status: 200, description: 'Conversation created or retrieved' })
  async createConversation(
    @CurrentUser() user: RequestUser,
    @Body() body: { sellerId: string; listingId?: string },
  ) {
    return this.chatService.createConversation(user.id, body.sellerId, body.listingId)
  }
}
