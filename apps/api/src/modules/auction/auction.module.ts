import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { AuctionGateway } from './auction.gateway';
import { AuctionProcessor } from './auction.processor';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    BullModule.registerQueueAsync({
      name: 'auction-queue',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuctionController],
  providers: [
    AuctionService,
    AuctionGateway,
    AuctionProcessor,
    PrismaService,
    RedisService,
  ],
  exports: [AuctionService, AuctionGateway],
})
export class AuctionModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuctionModule.name);

  constructor(private readonly auctionService: AuctionService) {}

  onModuleInit() {
    this.logger.log('Auction module initialized');
  }

  onModuleDestroy() {
    this.logger.log('Auction module destroyed');
  }
}
