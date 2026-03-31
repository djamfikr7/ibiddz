import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { SubscriptionService } from './subscription.service'
import { JwtGuard } from '../auth/jwt.guard'
import { CurrentUser, RequestUser } from '../../common/decorators/user.decorator'
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto'
import {
  SubscriptionResponseDto,
  SubscriptionPlansResponseDto,
} from './dto/subscription-response.dto'

@ApiTags('subscription')
@Controller('v1/subscription')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription tier' })
  @ApiBody({ type: UpgradeSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid tier or downgrade request' })
  @ApiResponse({ status: 403, description: 'ELITE tier is invite-only' })
  async upgrade(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradeSubscription(user.id, dto)
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription details',
    type: SubscriptionResponseDto,
  })
  async getCurrent(@CurrentUser() user: RequestUser) {
    return this.subscriptionService.getCurrentSubscription(user.id)
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel auto-renewal' })
  @ApiResponse({
    status: 200,
    description: 'Auto-renewal cancelled',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No active subscription to cancel' })
  async cancel(@CurrentUser() user: RequestUser) {
    return this.subscriptionService.cancelSubscription(user.id)
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Available subscription plans',
    type: SubscriptionPlansResponseDto,
  })
  async getPlans() {
    const plans = await this.subscriptionService.getPlans()
    return { plans }
  }
}
