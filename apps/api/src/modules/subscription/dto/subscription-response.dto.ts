import { ApiProperty } from '@nestjs/swagger'

export class SubscriptionBenefitDto {
  @ApiProperty({ description: 'Benefit name' })
  name!: string

  @ApiProperty({ description: 'Benefit value or description' })
  value!: string
}

export class SubscriptionPlanDto {
  @ApiProperty({ description: 'Tier name' })
  tier!: string

  @ApiProperty({ description: 'Monthly price in DZD' })
  price!: number

  @ApiProperty({ description: 'Whether the tier is invite-only' })
  inviteOnly!: boolean

  @ApiProperty({ type: [SubscriptionBenefitDto], description: 'List of benefits' })
  benefits!: SubscriptionBenefitDto[]
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Current subscription tier' })
  currentTier!: string

  @ApiProperty({ description: 'Monthly price in DZD' })
  price!: number

  @ApiProperty({ description: 'Subscription start date', nullable: true })
  subscriptionStart!: Date | null

  @ApiProperty({ description: 'Subscription end date', nullable: true })
  subscriptionEnd!: Date | null

  @ApiProperty({ description: 'Auto-renewal enabled' })
  autoRenew!: boolean

  @ApiProperty({ description: 'Days remaining in current period', nullable: true })
  daysRemaining!: number | null

  @ApiProperty({ type: [SubscriptionBenefitDto], description: 'Current tier benefits' })
  benefits!: SubscriptionBenefitDto[]

  @ApiProperty({ description: 'Commission discount percentage' })
  commissionDiscount!: number

  @ApiProperty({ description: 'Broadcast credit price in DZD' })
  broadcastCreditPrice!: number

  @ApiProperty({ description: 'Max broadcasts per day' })
  maxBroadcastsPerDay!: number
}

export class SubscriptionPlansResponseDto {
  @ApiProperty({ type: [SubscriptionPlanDto] })
  plans!: SubscriptionPlanDto[]
}
