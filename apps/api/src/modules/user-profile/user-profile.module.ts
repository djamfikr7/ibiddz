import { Module } from '@nestjs/common'
import { UserProfileController } from './user-profile.controller'
import { UserProfileService } from './user-profile.service'
import { PrismaService } from '../../common/services/prisma.service'

@Module({
  controllers: [UserProfileController],
  providers: [UserProfileService, PrismaService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
