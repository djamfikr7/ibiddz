import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { UseGuards, Logger } from '@nestjs/common'
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard'
import { ChatService } from './chat.service'

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(ChatGateway.name)
  private onlineUsers = new Map<string, string>()

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.data.user?.sub || client.data.user?.id
    if (userId) {
      this.onlineUsers.set(userId, client.id)
      this.logger.log(`User connected: ${userId}`)
      client.emit('connected', { userId })
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub || client.data.user?.id
    if (userId) {
      this.onlineUsers.delete(userId)
      this.logger.log(`User disconnected: ${userId}`)
    }
  }

  @SubscribeMessage('join:chat')
  handleJoinChat(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.conversationId}`
    client.join(room)
    this.logger.log(`User ${client.data.user?.sub} joined room ${room}`)
    return { event: 'joined', data: { conversationId: data.conversationId, room } }
  }

  @SubscribeMessage('leave:chat')
  handleLeaveChat(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.conversationId}`
    client.leave(room)
    return { event: 'left', data: { conversationId: data.conversationId, room } }
  }

  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string
      content: string
      type?: string
      imageUrl?: string
    },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user?.sub || client.data.user?.id

    if (!senderId) {
      return { event: 'error', data: { message: 'Unauthorized' } }
    }

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        senderId,
        data.content,
        data.type || 'TEXT',
        data.imageUrl,
      )

      const room = `chat:${data.conversationId}`
      this.server.to(room).emit('message:new', {
        ...message,
        senderId,
      })

      return { event: 'sent', data: message }
    } catch (error: any) {
      return {
        event: 'error',
        data: { message: error.message || 'Failed to send message' },
      }
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.user?.sub || client.data.user?.id
    const room = `chat:${data.conversationId}`

    this.server.to(room).emit('user:typing', {
      userId: senderId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    })

    return { event: 'typing_sent', data: { conversationId: data.conversationId } }
  }

  @SubscribeMessage('chat:read')
  async handleReadReceipt(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub || client.data.user?.id

    if (!userId) {
      return { event: 'error', data: { message: 'Unauthorized' } }
    }

    try {
      const result = await this.chatService.markAsRead(data.conversationId, userId)

      const room = `chat:${data.conversationId}`
      this.server.to(room).emit('message:read', {
        userId,
        conversationId: data.conversationId,
        markedCount: result.markedCount,
      })

      return { event: 'read_receipt_sent', data: { conversationId: data.conversationId } }
    } catch (error: any) {
      return {
        event: 'error',
        data: { message: error.message || 'Failed to mark as read' },
      }
    }
  }
}
