import { IsString, Matches, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Algerian phone number',
    example: '+213555123456',
  })
  @IsString()
  @Matches(/^(\+213|0)[567]\d{8}$/, {
    message:
      'Phone number must be a valid Algerian number (e.g., +213555123456 or 0555123456)',
  })
  phone!: string

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit numeric code' })
  code!: string
}
