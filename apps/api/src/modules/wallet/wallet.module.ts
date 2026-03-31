import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PayoutProcessor } from './payout.processor';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueueAsync({
      name: 'payouts',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, PayoutProcessor, PrismaService],
  exports: [WalletService],
})
export class WalletModule {}
