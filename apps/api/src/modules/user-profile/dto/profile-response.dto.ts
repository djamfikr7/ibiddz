import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class KycInfoDto {
  @ApiProperty({ description: 'KYC verification status', enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  status!: string

  @ApiProperty({ description: 'Whether CNIE is verified' })
  cnieVerified!: boolean

  @ApiProperty({ description: 'CNIE verification date', nullable: true })
  cnieVerifiedAt!: Date | null

  @ApiProperty({ description: 'CNIE front document URL', nullable: true })
  cnieFrontUrl!: string | null

  @ApiProperty({ description: 'CNIE back document URL', nullable: true })
  cnieBackUrl!: string | null
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total active listings' })
  activeListings!: number

  @ApiProperty({ description: 'Total completed sales' })
  totalSales!: number

  @ApiProperty({ description: 'Total purchases' })
  totalPurchases!: number

  @ApiProperty({ description: 'Average rating', nullable: true })
  avgRating!: number | null

  @ApiProperty({ description: 'Total number of ratings' })
  ratingCount!: number

  @ApiProperty({ description: 'Trust score' })
  trustScore!: number

  @ApiProperty({ description: 'Trust tier', enum: ['NEW', 'ACTIVE', 'TRUSTED', 'ELITE'] })
  trustTier!: string

  @ApiProperty({ description: 'Member since date' })
  memberSince!: Date

  @ApiProperty({ description: 'Total followers' })
  followersCount!: number

  @ApiProperty({ description: 'Total following' })
  followingCount!: number
}

export class ProfileResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  phone!: string

  @ApiProperty({ nullable: true })
  displayName!: string | null

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null

  @ApiProperty({ nullable: true })
  bio!: string | null

  @ApiProperty({ nullable: true })
  wilaya!: string | null

  @ApiProperty({ nullable: true })
  city!: string | null

  @ApiProperty()
  role!: string

  @ApiProperty()
  isVerified!: boolean

  @ApiProperty({ type: () => KycInfoDto })
  kyc!: KycInfoDto

  @ApiProperty({ type: () => UserStatsDto })
  stats!: UserStatsDto

  @ApiProperty({ description: 'Notification preferences', nullable: true })
  notificationPreferences!: Record<string, boolean> | null

  @ApiProperty({ description: 'Privacy settings', nullable: true })
  privacySettings!: Record<string, boolean> | null

  @ApiProperty()
  createdAt!: Date
}

export class PublicProfileResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ nullable: true })
  displayName!: string | null

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null

  @ApiProperty({ nullable: true })
  bio!: string | null

  @ApiProperty({ nullable: true })
  wilaya!: string | null

  @ApiProperty()
  role!: string

  @ApiProperty()
  trustScore!: number

  @ApiProperty({ description: 'Trust tier', enum: ['NEW', 'ACTIVE', 'TRUSTED', 'ELITE'] })
  trustTier!: string

  @ApiProperty()
  isVerified!: boolean

  @ApiProperty({ type: () => UserStatsDto })
  stats!: UserStatsDto

  @ApiProperty()
  memberSince!: Date
}
