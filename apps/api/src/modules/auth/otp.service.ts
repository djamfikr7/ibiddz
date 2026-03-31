import { Injectable, Logger } from '@nestjs/common'
import { randomInt } from 'crypto'

interface OtpRecord {
  phone: string
  code: string
  attempts: number
  expiresAt: Date
  createdAt: Date
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)
  private readonly store = new Map<string, OtpRecord>()
  private readonly OTP_LENGTH = 6
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000
  private readonly MAX_ATTEMPTS = 3

  generate(phone: string): string {
    const code = this.generateCode()
    const now = new Date()

    this.store.set(phone, {
      phone,
      code,
      attempts: 0,
      expiresAt: new Date(now.getTime() + this.OTP_EXPIRY_MS),
      createdAt: now,
    })

    this.logger.log(`OTP generated for phone: ${this.maskPhone(phone)}`)

    return code
  }

  async sendSms(phone: string, code: string): Promise<boolean> {
    this.logger.log(
      `Sending OTP ${code} to ${this.maskPhone(phone)} via SMS provider`,
    )

    try {
      await this.smsProviderSend(phone, code)
      this.logger.log(`SMS sent successfully to ${this.maskPhone(phone)}`)
      return true
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${this.maskPhone(phone)}: ${error}`,
      )
      return false
    }
  }

  verify(phone: string, code: string): { valid: boolean; error?: string } {
    const record = this.store.get(phone)

    if (!record) {
      return { valid: false, error: 'No OTP found for this phone number' }
    }

    if (new Date() > record.expiresAt) {
      this.store.delete(phone)
      return { valid: false, error: 'OTP has expired' }
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(phone)
      return { valid: false, error: 'Maximum verification attempts exceeded' }
    }

    if (record.code !== code) {
      record.attempts += 1
      this.store.set(phone, record)
      return {
        valid: false,
        error: `Invalid OTP code. ${this.MAX_ATTEMPTS - record.attempts} attempts remaining`,
      }
    }

    this.store.delete(phone)
    return { valid: true }
  }

  private generateCode(): string {
    return String(randomInt(0, 10 ** this.OTP_LENGTH)).padStart(
      this.OTP_LENGTH,
      '0',
    )
  }

  private async smsProviderSend(
    phone: string,
    code: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.logger.debug(
          `Mock SMS: Code ${code} sent to ${this.maskPhone(phone)}`,
        )
        resolve()
      }, 100)
    })
  }

  private maskPhone(phone: string): string {
    return phone.slice(0, -4) + '****'
  }

  cleanupExpired(): void {
    const now = new Date()
    for (const [phone, record] of this.store.entries()) {
      if (now > record.expiresAt || record.attempts >= this.MAX_ATTEMPTS) {
        this.store.delete(phone)
      }
    }
  }
}
