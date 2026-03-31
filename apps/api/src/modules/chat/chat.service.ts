import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { RATE_LIMITS } from '@ibiddz/shared'

const MESSAGE_RETENTION_DAYS = 90
const MAX_MESSAGES_PER_MINUTE = RATE_LIMITS.MESSAGE_SEND.MAX_REQUESTS

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  private messageRateLimit = new Map<string, number[]>()

  constructor(private readonly prisma: PrismaService) {}

  async createConversation(
    buyerId: string,
    sellerId: string,
    listingId?: string,
  ) {
    if (buyerId === sellerId) {
      throw new HttpException('Cannot create conversation with yourself', HttpStatus.BAD_REQUEST)
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        buyerId,
        sellerId,
        listingId: listingId || null,
      },
    })

    if (existing) {
      return existing
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        buyerId,
        sellerId,
        listingId: listingId || null,
      },
    })

    this.logger.log(`Conversation created: ${conversation.id} between ${buyerId} and ${sellerId}`)

    return conversation
  }

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS)

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            conversationId: conv.id,
            createdAt: { gte: cutoffDate },
          },
          orderBy: { createdAt: 'desc' },
        })

        const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: otherUserId,
            read: false,
            createdAt: { gte: cutoffDate },
          },
        })

        const isBlocked = await this.prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: userId, blockedId: otherUserId },
              { blockerId: otherUserId, blockedId: userId },
            ],
          },
        })

        return {
          id: conv.id,
          buyer: conv.buyer,
          seller: conv.seller,
          listingId: conv.listingId,
          lastMessage: lastMessage ? this.sanitizeMessage(lastMessage) : null,
          unreadCount,
          updatedAt: conv.updatedAt,
          createdAt: conv.createdAt,
          isBlocked: !!isBlocked,
        }
      }),
    )

    return conversationsWithDetails
  }

  async getConversationDetail(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND)
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    }

    return {
      id: conversation.id,
      buyer: conversation.buyer,
      seller: conversation.seller,
      listingId: conversation.listingId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND)
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS)

    const whereClause: any = {
      conversationId,
      createdAt: { gte: cutoffDate },
    }

    if (cursor) {
      const cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      })

      if (cursorMessage) {
        whereClause.createdAt = { lt: cursorMessage.createdAt, gte: cutoffDate }
      }
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages

    const unreadMessageIds = messagesToReturn
      .filter((m) => m.senderId !== userId && !m.read)
      .map((m) => m.id)

    if (unreadMessageIds.length > 0) {
      await this.prisma.message.updateMany({
        where: {
          id: { in: unreadMessageIds },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    }

    return {
      messages: messagesToReturn.reverse().map(this.sanitizeMessage),
      cursor: hasMore ? messagesToReturn[messagesToReturn.length - 1].id : null,
      hasMore,
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: string = 'TEXT',
    imageUrl?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND)
    }

    if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    }

    const isBlocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: conversation.buyerId, blockedId: senderId },
          { blockerId: conversation.sellerId, blockedId: senderId },
        ],
      },
    })

    if (isBlocked) {
      throw new HttpException('You cannot send messages in this conversation', HttpStatus.FORBIDDEN)
    }

    this.checkRateLimit(senderId)

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type as any,
        imageUrl: imageUrl || null,
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return this.sanitizeMessage(message)
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND)
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    }

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return { markedCount: result.count }
  }

  async blockUser(blockerId: string, blockedId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND)
    }

    if (
      (conversation.buyerId !== blockerId && conversation.sellerId !== blockerId) ||
      (conversation.buyerId !== blockedId && conversation.sellerId !== blockedId)
    ) {
      throw new HttpException('Invalid block request', HttpStatus.BAD_REQUEST)
    }

    const existing = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

    if (existing) {
      return { message: 'User already blocked' }
    }

    await this.prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    })

    this.logger.log(`User ${blockerId} blocked ${blockedId} in conversation ${conversationId}`)

    return { message: 'User blocked successfully' }
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    })

    return { message: 'User unblocked successfully' }
  }

  async cleanupOldMessages() {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS)

    const result = await this.prisma.message.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    this.logger.log(`Cleaned up ${result.count} messages older than ${MESSAGE_RETENTION_DAYS} days`)

    return result.count
  }

  private checkRateLimit(userId: string) {
    const now = Date.now()
    const windowMs = RATE_LIMITS.MESSAGE_SEND.WINDOW_MS
    const maxRequests = RATE_LIMITS.MESSAGE_SEND.MAX_REQUESTS

    let timestamps = this.messageRateLimit.get(userId) || []
    timestamps = timestamps.filter((ts) => now - ts < windowMs)

    if (timestamps.length >= maxRequests) {
      throw new HttpException(
        `Rate limit exceeded. Maximum ${maxRequests} messages per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    timestamps.push(now)
    this.messageRateLimit.set(userId, timestamps)
  }

  private sanitizeMessage(message: any) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      imageUrl: message.imageUrl,
      read: message.read,
      readAt: message.readAt,
      createdAt: message.createdAt,
    }
  }
}
