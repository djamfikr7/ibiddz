import { Controller, Get, Patch, Post, Body, Param, UseGuards, Req } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger'
import { UserProfileService } from './user-profile.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CurrentUser, RequestUser } from '../../common/decorators/user.decorator'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { KycSubmitDto } from './dto/kyc-submit.dto'

@ApiTags('user-profile')
@Controller('v1/profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: RequestUser) {
    return this.userProfileService.getProfile(user.id)
  }

  @Patch()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userProfileService.updateProfile(user.id, dto)
  }

  @Post('kyc')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit KYC documents' })
  @ApiBody({ type: KycSubmitDto })
  @ApiResponse({ status: 200, description: 'KYC document submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid document data' })
  @ApiResponse({ status: 409, description: 'CNIE already registered' })
  async submitKyc(
    @CurrentUser() user: RequestUser,
    @Body() dto: KycSubmitDto,
  ) {
    return this.userProfileService.submitKyc(user.id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile view' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser | null,
  ) {
    return this.userProfileService.getPublicProfile(id, user?.id)
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user stats' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  async getStats(@CurrentUser() user: RequestUser) {
    return this.userProfileService.getUserStats(user.id)
  }
}
