import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';
import { ModerationService } from './moderation.service';
import { BanningService } from './banning.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  controllers: [TrustController],
  providers: [TrustService, ModerationService, BanningService, PrismaService, RedisService],
  exports: [TrustService, ModerationService, BanningService],
})
export class TrustModule {}
