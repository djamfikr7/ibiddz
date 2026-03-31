import { Module } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { AuctionsGateway } from "../auctions/auctions.gateway";

@Module({
  providers: [ChatGateway, AuctionsGateway],
  exports: [ChatGateway, AuctionsGateway],
})
export class GatewayModule {}
