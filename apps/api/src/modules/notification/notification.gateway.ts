import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  actionUrl: string | null;
  createdAt: Date;
  read: boolean;
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "notifications",
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const token = client.handshake.auth.token as string;

    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } else {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage("join")
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} joined notifications room`);
      return { event: "joined", data: { userId } };
    }
    return { event: "error", data: { message: "userId required" } };
  }

  @SubscribeMessage("mark_read")
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    return {
      event: "marked_read",
      data: { notificationId: data.notificationId },
    };
  }

  sendToUser(userId: string, notification: NotificationPayload): void {
    this.server.to(`user:${userId}`).emit("notification", notification);
    this.logger.debug(
      `Sent notification ${notification.id} to user ${userId}`,
    );
  }

  sendToUsers(
    userIds: string[],
    notification: NotificationPayload,
  ): void {
    for (const userId of userIds) {
      this.sendToUser(userId, notification);
    }
  }

  sendBroadcast(notification: NotificationPayload): void {
    this.server.emit("notification", notification);
    this.logger.debug(`Broadcast notification ${notification.id}`);
  }

  getOnlineCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
