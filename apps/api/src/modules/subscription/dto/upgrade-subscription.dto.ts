import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum UpgradeTier {
  PRO = 'PRO',
  CERTIFIE = 'CERTIFIE',
  ELITE = 'ELITE',
}

export enum PaymentMethod {
  CCP = 'CCP',
  EDAHABIA = 'EDAHABIA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: UpgradeTier, description: 'Target subscription tier' })
  @IsEnum(UpgradeTier)
  tier!: UpgradeTier

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method for subscription' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod

  @ApiPropertyOptional({ description: 'External payment reference (for manual payment)' })
  @IsOptional()
  @IsString()
  paymentReference?: string
}
