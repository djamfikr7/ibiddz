import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { OtpService } from './otp.service'
import { SendOtpDto } from './dto/send-otp.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly prisma: PrismaClient

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {
    this.prisma = new PrismaClient()
  }

  async sendOtp(dto: SendOtpDto, deviceFingerprint?: string): Promise<{ message: string }> {
    const normalizedPhone = this.normalizePhone(dto.phone)
    const code = this.otpService.generate(normalizedPhone)
    const sent = await this.otpService.sendSms(normalizedPhone, code)

    if (!sent) {
      throw new HttpException(
        'Failed to send OTP. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    this.logger.log(
      `OTP sent to ${normalizedPhone}${deviceFingerprint ? ` from device ${deviceFingerprint}` : ''}`,
    )
    return { message: 'OTP sent successfully' }
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    deviceFingerprint?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const normalizedPhone = this.normalizePhone(dto.phone)
    const verification = this.otpService.verify(normalizedPhone, dto.code)

    if (!verification.valid) {
      throw new BadRequestException(verification.error)
    }

    let user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          role: 'BASICO',
          phoneVerified: true,
        },
      })
      this.logger.log(`New user created: ${normalizedPhone}`)
    } else if (!user.phoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      })
      user = { ...user, phoneVerified: true }
    }

    const tokens = await this.generateTokens(user)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        deviceFingerprint: deviceFingerprint || user.deviceFingerprint,
        lastLoginAt: new Date(),
        metadata: {
          ...(user.metadata as object || {}),
          lastRefreshToken: refreshTokenHash,
          lastRefreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    })

    this.logger.log(
      `User verified and authenticated: ${normalizedPhone}${deviceFingerprint ? ` on device ${deviceFingerprint}` : ''}`,
    )

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    }
  }

  async refreshToken(
    refreshToken: string,
    deviceFingerprint?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string }

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const metadata = (user.metadata as Record<string, any>) || {}
    const storedHash = metadata.lastRefreshToken
    const storedExpiry = metadata.lastRefreshTokenExpiry

    if (!storedHash || new Date(storedExpiry) < new Date()) {
      throw new UnauthorizedException('Refresh token not found or expired')
    }

    const match = await bcrypt.compare(refreshToken, storedHash)
    if (!match) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (deviceFingerprint && user.deviceFingerprint) {
      if (user.deviceFingerprint !== deviceFingerprint) {
        throw new ForbiddenException('Device fingerprint mismatch')
      }
    }

    const tokens = await this.generateTokens(user)
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...metadata,
          lastRefreshToken: newRefreshTokenHash,
          lastRefreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        phoneVerified: true,
        trustScore: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          lastRefreshToken: null,
          lastRefreshTokenExpiry: null,
        },
      },
    })
    return { message: 'Logged out successfully' }
  }

  private async generateTokens(user: any): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ])

    return { accessToken, refreshToken }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+213' + cleaned.slice(1)
    }
    return cleaned
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user
    return sanitized
  }
}
