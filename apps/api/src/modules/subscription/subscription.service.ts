import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto'
import {
  SubscriptionBenefitDto,
  SubscriptionPlanDto,
  SubscriptionResponseDto,
} from './dto/subscription-response.dto'
import { BROADCAST_CREDITS, TIER_DISCOUNTS } from '@ibiddz/shared'

interface TierConfig {
  price: number
  inviteOnly: boolean
  commissionDiscount: number
  broadcastCreditPrice: number
  maxBroadcastsPerDay: number
  benefits: SubscriptionBenefitDto[]
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  BASICO: {
    price: 0,
    inviteOnly: false,
    commissionDiscount: 0,
    broadcastCreditPrice: BROADCAST_CREDITS.BASICO.price,
    maxBroadcastsPerDay: BROADCAST_CREDITS.BASICO.maxPerDay,
    benefits: [
      { name: 'Commission Rate', value: '5% standard' },
      { name: 'Broadcast Credits', value: `${BROADCAST_CREDITS.BASICO.maxPerDay}/day at ${BROADCAST_CREDITS.BASICO.price} DZD each` },
      { name: 'Listings', value: 'Unlimited' },
      { name: 'Support', value: 'Community' },
    ],
  },
  PRO: {
    price: 2900,
    inviteOnly: false,
    commissionDiscount: TIER_DISCOUNTS.PRO * 100,
    broadcastCreditPrice: BROADCAST_CREDITS.PRO.price,
    maxBroadcastsPerDay: BROADCAST_CREDITS.PRO.maxPerDay,
    benefits: [
      { name: 'Commission Rate', value: '4% (20% discount)' },
      { name: 'Broadcast Credits', value: `${BROADCAST_CREDITS.PRO.maxPerDay}/day at ${BROADCAST_CREDITS.PRO.price} DZD each` },
      { name: 'Badge', value: 'PRO seller badge' },
      { name: 'Priority', value: 'Priority listing placement' },
      { name: 'Support', value: 'Email support' },
    ],
  },
  CERTIFIE: {
    price: 7900,
    inviteOnly: false,
    commissionDiscount: TIER_DISCOUNTS.CERTIFIE * 100,
    broadcastCreditPrice: BROADCAST_CREDITS.CERTIFIE.price,
    maxBroadcastsPerDay: BROADCAST_CREDITS.CERTIFIE.maxPerDay,
    benefits: [
      { name: 'Commission Rate', value: '3% (40% discount)' },
      { name: 'Broadcast Credits', value: `${BROADCAST_CREDITS.CERTIFIE.maxPerDay}/day at ${BROADCAST_CREDITS.CERTIFIE.price} DZD each` },
      { name: 'Badge', value: 'Certified seller badge' },
      { name: 'Verification', value: 'Verified identity checkmark' },
      { name: 'Priority', value: 'Top placement in search' },
      { name: 'Analytics', value: 'Advanced sales analytics' },
      { name: 'Support', value: 'Priority support' },
    ],
  },
  ELITE: {
    price: 0,
    inviteOnly: true,
    commissionDiscount: TIER_DISCOUNTS.ELITE * 100,
    broadcastCreditPrice: BROADCAST_CREDITS.ELITE.price,
    maxBroadcastsPerDay: BROADCAST_CREDITS.ELITE.maxPerDay,
    benefits: [
      { name: 'Commission Rate', value: '2% (60% discount)' },
      { name: 'Broadcast Credits', value: `${BROADCAST_CREDITS.ELITE.maxPerDay}/day at ${BROADCAST_CREDITS.ELITE.price} DZD each` },
      { name: 'Badge', value: 'Elite seller badge' },
      { name: 'Verification', value: 'Verified identity checkmark' },
      { name: 'Priority', value: '#1 placement in all searches' },
      { name: 'Analytics', value: 'Full analytics dashboard' },
      { name: 'Support', value: 'Dedicated account manager' },
      { name: 'Features', value: 'Early access to new features' },
    ],
  },
}

const TIER_ORDER = ['BASICO', 'PRO', 'CERTIFIE', 'ELITE']

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSubscription(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        broadcastCredits: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const tier = user.role || 'BASICO'
    const config = TIER_CONFIGS[tier] || TIER_CONFIGS.BASICO

    let daysRemaining: number | null = null
    let autoRenew = false

    if (user.subscriptionEnd) {
      const now = new Date()
      const end = new Date(user.subscriptionEnd)
      const diffMs = end.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      autoRenew = daysRemaining > 0
    }

    return {
      currentTier: tier,
      price: config.price,
      subscriptionStart: user.subscriptionStart || null,
      subscriptionEnd: user.subscriptionEnd || null,
      autoRenew,
      daysRemaining,
      benefits: config.benefits,
      commissionDiscount: config.commissionDiscount,
      broadcastCreditPrice: config.broadcastCreditPrice,
      maxBroadcastsPerDay: config.maxBroadcastsPerDay,
    }
  }

  async getPlans(): Promise<SubscriptionPlanDto[]> {
    return TIER_ORDER.map((tier) => {
      const config = TIER_CONFIGS[tier]
      return {
        tier,
        price: config.price,
        inviteOnly: config.inviteOnly,
        benefits: config.benefits,
      }
    })
  }

  async upgradeSubscription(
    userId: string,
    dto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const targetTier = dto.tier
    const currentTier = user.role || 'BASICO'
    const targetConfig = TIER_CONFIGS[targetTier]
    const currentConfig = TIER_CONFIGS[currentTier]

    if (!targetConfig) {
      throw new HttpException('Invalid tier selected', HttpStatus.BAD_REQUEST)
    }

    if (targetConfig.inviteOnly) {
      throw new HttpException(
        'ELITE tier is invite-only. Contact support for access.',
        HttpStatus.FORBIDDEN,
      )
    }

    const currentTierIndex = TIER_ORDER.indexOf(currentTier)
    const targetTierIndex = TIER_ORDER.indexOf(targetTier)

    if (targetTierIndex <= currentTierIndex) {
      throw new HttpException(
        'Use downgrade endpoint to change to a lower tier',
        HttpStatus.BAD_REQUEST,
      )
    }

    const now = new Date()
    let newStart: Date
    let newEnd: Date

    if (user.subscriptionEnd && user.subscriptionEnd > now) {
      const remainingDays = Math.ceil(
        (user.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      const currentTierValue = currentConfig.price * (remainingDays / 30)
      const newTierFullPrice = targetConfig.price
      const proratedPrice = newTierFullPrice - currentTierValue

      if (proratedPrice <= 0) {
        throw new HttpException(
          'Your current subscription covers this upgrade. Please wait or contact support.',
          HttpStatus.BAD_REQUEST,
        )
      }

      newStart = now
      newEnd = new Date(user.subscriptionEnd.getTime())
    } else {
      newStart = now
      newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: targetTier,
        subscriptionStart: newStart,
        subscriptionEnd: newEnd,
      },
    })

    this.logger.log(`User ${userId} upgraded from ${currentTier} to ${targetTier}`)

    return this.getCurrentSubscription(userId)
  }

  async cancelSubscription(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    if (!user.subscriptionEnd || user.subscriptionEnd <= new Date()) {
      throw new HttpException('No active subscription to cancel', HttpStatus.BAD_REQUEST)
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionEnd: null,
      },
    })

    this.logger.log(`User ${userId} cancelled auto-renewal`)

    return this.getCurrentSubscription(userId)
  }

  async processDowngrade(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    if (!user.subscriptionEnd || user.subscriptionEnd > new Date()) {
      throw new HttpException(
        'Downgrade will take effect at the end of your current billing period',
        HttpStatus.BAD_REQUEST,
      )
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'BASICO',
        subscriptionStart: null,
        subscriptionEnd: null,
      },
    })

    this.logger.log(`User ${userId} downgraded to BASICO`)

    return this.getCurrentSubscription(userId)
  }
}
