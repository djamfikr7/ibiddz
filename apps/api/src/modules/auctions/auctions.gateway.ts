import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { WsJwtGuard } from "../../common/guards/ws-jwt.guard";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "auctions",
})
@UseGuards(WsJwtGuard)
export class AuctionsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("join-auction")
  handleJoinAuction(@MessageBody() auctionId: string, @ConnectedSocket() client: Socket) {
    client.join(`auction:${auctionId}`);
    return { event: "joined", data: { auctionId } };
  }

  @SubscribeMessage("leave-auction")
  handleLeaveAuction(@MessageBody() auctionId: string, @ConnectedSocket() client: Socket) {
    client.leave(`auction:${auctionId}`);
    return { event: "left", data: { auctionId } };
  }

  broadcastBid(auctionId: string, bidData: any) {
    this.server.to(`auction:${auctionId}`).emit("new-bid", bidData);
  }

  broadcastAuctionEnd(auctionId: string, result: any) {
    this.server.to(`auction:${auctionId}`).emit("auction-ended", result);
  }

  broadcastTimeUpdate(auctionId: string, timeRemaining: number) {
    this.server.to(`auction:${auctionId}`).emit("time-update", { timeRemaining });
  }
}
