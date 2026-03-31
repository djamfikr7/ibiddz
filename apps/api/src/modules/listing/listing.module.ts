import { Module } from '@nestjs/common'
import { ListingController } from './listing.controller'
import { ListingService } from './listing.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [ListingController],
  providers: [ListingService, PrismaService],
  exports: [ListingService],
})
export class ListingModule {}
