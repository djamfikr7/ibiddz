import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { KycSubmitDto, KycDocumentType } from './dto/kyc-submit.dto'

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        phoneVerified: true,
        cnieNumber: true,
        cnieFrontUrl: true,
        cnieBackUrl: true,
        cnieVerified: true,
        cnieVerifiedAt: true,
        metadata: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const stats = await this.getUserStats(userId)

    const metadata = (user.metadata as Record<string, any>) || {}
    const notificationPreferences = metadata.notificationPreferences || null
    const privacySettings = metadata.privacySettings || null
    const location = metadata.location || {}

    return {
      id: user.id,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      wilaya: location.wilaya || null,
      city: location.city || null,
      role: user.role,
      isVerified: user.phoneVerified,
      kyc: {
        status: this.getKycStatus(user.cnieVerified, user.cnieFrontUrl),
        cnieVerified: user.cnieVerified,
        cnieVerifiedAt: user.cnieVerifiedAt,
        cnieFrontUrl: user.cnieFrontUrl,
        cnieBackUrl: user.cnieBackUrl,
      },
      stats,
      notificationPreferences,
      privacySettings,
      createdAt: user.createdAt,
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const updateData: Record<string, any> = {}

    if (dto.displayName !== undefined) updateData.displayName = dto.displayName
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl
    if (dto.bio !== undefined) updateData.bio = dto.bio

    const existingMetadata = (user.metadata as Record<string, any>) || {}

    if (dto.wilaya !== undefined || dto.city !== undefined) {
      const existingLocation = existingMetadata.location || {}
      updateData.metadata = {
        ...existingMetadata,
        location: {
          ...existingLocation,
          ...(dto.wilaya && { wilaya: dto.wilaya }),
          ...(dto.city && { city: dto.city }),
        },
      }
    }

    if (dto.notificationPreferences !== undefined || dto.privacySettings !== undefined) {
      updateData.metadata = {
        ...(updateData.metadata || existingMetadata),
        ...(dto.notificationPreferences && { notificationPreferences: dto.notificationPreferences }),
        ...(dto.privacySettings && { privacySettings: dto.privacySettings }),
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        metadata: true,
        updatedAt: true,
      },
    })

    this.logger.log(`User ${userId} updated profile`)

    return this.getProfile(userId)
  }

  async submitKyc(userId: string, dto: KycSubmitDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const updateData: Record<string, any> = {}

    switch (dto.documentType) {
      case KycDocumentType.CNIE_FRONT:
        updateData.cnieFrontUrl = dto.documentUrl
        updateData.cnieVerified = false
        updateData.cnieVerifiedAt = null
        break
      case KycDocumentType.CNIE_BACK:
        updateData.cnieBackUrl = dto.documentUrl
        updateData.cnieVerified = false
        updateData.cnieVerifiedAt = null
        break
      case KycDocumentType.PASSPORT:
        updateData.cnieFrontUrl = dto.documentUrl
        updateData.cnieVerified = false
        updateData.cnieVerifiedAt = null
        break
      case KycDocumentType.PROOF_OF_ADDRESS:
        const existingMetadata = (user.metadata as Record<string, any>) || {}
        const addressDocs = existingMetadata.addressDocuments || []
        updateData.metadata = {
          ...existingMetadata,
          addressDocuments: [...addressDocs, dto.documentUrl],
        }
        break
    }

    if (dto.cnieNumber) {
      const existingWithCnie = await this.prisma.user.findUnique({
        where: { cnieNumber: dto.cnieNumber },
      })

      if (existingWithCnie && existingWithCnie.id !== userId) {
        throw new HttpException('CNIE number already registered to another account', HttpStatus.CONFLICT)
      }

      updateData.cnieNumber = dto.cnieNumber
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    this.logger.log(`User ${userId} submitted KYC document: ${dto.documentType}`)

    return {
      message: 'KYC document submitted successfully. Verification is pending.',
      status: 'PENDING',
    }
  }

  async getPublicProfile(targetId: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        metadata: true,
        role: true,
        trustScore: true,
        phoneVerified: true,
        cnieVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const stats = await this.getUserStats(targetId)
    const trustTier = this.calculateTrustTier(user.trustScore)
    const location = ((user.metadata as Record<string, any>) || {}).location || {}

    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      wilaya: location.wilaya || null,
      role: user.role,
      trustScore: user.trustScore,
      trustTier,
      isVerified: user.phoneVerified && user.cnieVerified,
      stats,
      memberSince: user.createdAt,
    }
  }

  async getUserStats(userId: string) {
    const [
      activeListings,
      totalSales,
      totalPurchases,
      reviews,
      followersCount,
      followingCount,
    ] = await Promise.all([
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'ACTIVE' },
      }),
      this.prisma.order.count({
        where: { sellerId: userId, status: 'DELIVERED' },
      }),
      this.prisma.order.count({
        where: { buyerId: userId, status: 'DELIVERED' },
      }),
      this.prisma.review.aggregate({
        where: { targetId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ])

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true, createdAt: true },
    })

    return {
      activeListings,
      totalSales,
      totalPurchases,
      avgRating: reviews._avg.rating ? Math.round(Number(reviews._avg.rating) * 10) / 10 : null,
      ratingCount: reviews._count.rating,
      trustScore: user?.trustScore || 0,
      trustTier: this.calculateTrustTier(user?.trustScore || 0),
      memberSince: user?.createdAt || new Date(),
      followersCount,
      followingCount,
    }
  }

  private getKycStatus(cnieVerified: boolean, cnieFrontUrl: string | null): string {
    if (cnieVerified) return 'VERIFIED'
    if (cnieFrontUrl) return 'PENDING'
    return 'PENDING'
  }

  private calculateTrustTier(score: number): string {
    if (score >= 88) return 'ELITE'
    if (score >= 75) return 'TRUSTED'
    if (score >= 60) return 'ACTIVE'
    return 'NEW'
  }
}
