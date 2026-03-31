import { IsString, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendOtpDto {
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
}
