import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { BroadcastController } from "./broadcast.controller";
import { BroadcastService } from "./broadcast.service";
import { BroadcastProcessor } from "./broadcast.processor";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    ConfigModule,
    NotificationModule,
    BullModule.registerQueueAsync({
      name: "broadcast-queue",
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
          password: configService.get<string>("REDIS_PASSWORD"),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600,
            count: 100,
          },
          removeOnFail: {
            age: 86400,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [BroadcastController],
  providers: [
    BroadcastService,
    BroadcastProcessor,
    PrismaService,
    RedisService,
  ],
  exports: [BroadcastService],
})
export class BroadcastModule {}
