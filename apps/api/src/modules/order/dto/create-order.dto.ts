import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  COD = 'COD',
  CCP = 'CCP',
  EDAHABIA = 'EDAHABIA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID of the listing being purchased',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.COD;

  @ApiProperty({
    description: 'Recipient full name',
    example: 'Mohamed Benali',
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '0555123456',
  })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({
    description: 'Wilaya (Algerian state)',
    example: 'Alger',
  })
  @IsString()
  @IsNotEmpty()
  wilaya: string;

  @ApiPropertyOptional({
    description: 'City or commune',
    example: 'Bab Ezzouar',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Full delivery address',
    example: 'Rue des Frères Bouadou, Immeuble 5, 3ème étage',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    description: 'Additional delivery notes',
    example: 'Appeler avant de livrer',
  })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;
}
