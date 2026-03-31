import { Module } from "@nestjs/common";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { TrustModule } from "../trust/trust.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [TrustModule, NotificationModule],
  controllers: [ReviewController],
  providers: [ReviewService, PrismaService, RedisService],
  exports: [ReviewService],
})
export class ReviewModule {}
