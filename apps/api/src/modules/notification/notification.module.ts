import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationGateway } from "./notification.gateway";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, PrismaService, RedisService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
