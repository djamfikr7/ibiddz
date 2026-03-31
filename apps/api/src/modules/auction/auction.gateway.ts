import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/auctions',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionGateway.name);
  private readonly connectedClients = new Map<string, { userId: string; phone: string }>();
  private readonly clientAuctionRooms = new Map<string, Set<string>>();

  constructor(@Inject(forwardRef(() => AuctionService)) private readonly auctionService: AuctionService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      const phone = client.handshake.query.phone as string;

      if (!userId) {
        this.logger.warn(`Connection rejected: no userId for client ${client.id}`);
        client.disconnect(true);
        return;
      }

      this.connectedClients.set(client.id, { userId, phone: phone || '' });
      this.clientAuctionRooms.set(client.id, new Set());

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}: ${error.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);
    this.clientAuctionRooms.delete(client.id);

    if (clientInfo) {
      this.logger.log(`Client disconnected: ${client.id} (user: ${clientInfo.userId})`);
    }
  }

  @SubscribeMessage('join:auction')
  async handleJoinAuction(
    @MessageBody() data: { listingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `auction:${data.listingId}`;
    await client.join(room);

    const rooms = this.clientAuctionRooms.get(client.id);
    if (rooms) {
      rooms.add(data.listingId);
    }

    this.logger.log(`Client ${client.id} joined room: ${room}`);

    try {
      const state = await this.auctionService.getStateDto(data.listingId);
      client.emit('auction:state', state);
    } catch (error) {
      client.emit('error', { message: error.message, code: 'AUCTION_NOT_FOUND' });
    }

    return { event: 'joined', room };
  }

  @SubscribeMessage('leave:auction')
  async handleLeaveAuction(
    @MessageBody() data: { listingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `auction:${data.listingId}`;
    await client.leave(room);

    const rooms = this.clientAuctionRooms.get(client.id);
    if (rooms) {
      rooms.delete(data.listingId);
    }

    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left', room };
  }

  @SubscribeMessage('bid:place')
  async handlePlaceBid(
    @MessageBody() data: { listingId: string; bid: PlaceBidDto },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
      return { event: 'error', message: 'Authentication required' };
    }

    try {
      const result = await this.auctionService.placeBid(
        data.listingId,
        clientInfo.userId,
        clientInfo.phone,
        data.bid,
      );

      return { event: 'bid:placed', data: result };
    } catch (error) {
      const errorCode = this.getErrorCode(error);
      client.emit('bid:error', {
        message: error.message,
        code: errorCode,
        listingId: data.listingId,
      });
      return { event: 'bid:error', message: error.message, code: errorCode };
    }
  }

  @SubscribeMessage('auction:state:request')
  async handleStateRequest(
    @MessageBody() data: { listingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.auctionService.getStateDto(data.listingId);
      client.emit('auction:state', state);
      return { event: 'auction:state', data: state };
    } catch (error) {
      client.emit('error', { message: error.message, code: 'AUCTION_NOT_FOUND' });
      return { event: 'error', message: error.message };
    }
  }

  emitBidNew(listingId: string, payload: any) {
    this.server.to(`auction:${listingId}`).emit('bid:new', payload);
  }

  emitBidOutbid(listingId: string, payload: any) {
    this.server.to(`auction:${listingId}`).emit('bid:outbid', payload);
  }

  emitAuctionState(listingId: string, state: any) {
    this.server.to(`auction:${listingId}`).emit('auction:state', state);
  }

  emitAuctionCountdown(listingId: string, payload: any) {
    this.server.to(`auction:${listingId}`).emit('auction:countdown', payload);
  }

  emitAuctionWon(listingId: string, payload: any) {
    this.server.to(`auction:${listingId}`).emit('auction:won', payload);
  }

  emitAuctionEnded(listingId: string, payload: any) {
    this.server.to(`auction:${listingId}`).emit('auction:ended', payload);
  }

  private getErrorCode(error: any): string {
    if (error.status === 400) return 'BAD_REQUEST';
    if (error.status === 404) return 'NOT_FOUND';
    if (error.status === 409) return 'CONFLICT';
    if (error.status === 429) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
  }
}
