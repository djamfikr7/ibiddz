import { IsEnum, IsString, IsOptional, IsArray, IsUrl } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum KycDocumentType {
  CNIE_FRONT = 'CNIE_FRONT',
  CNIE_BACK = 'CNIE_BACK',
  PASSPORT = 'PASSPORT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
}

export class KycSubmitDto {
  @ApiProperty({ enum: KycDocumentType, description: 'Type of KYC document' })
  @IsEnum(KycDocumentType)
  documentType!: KycDocumentType

  @ApiProperty({ description: 'URL of the uploaded document' })
  @IsUrl()
  documentUrl!: string

  @ApiPropertyOptional({ description: 'CNIE number (if applicable)' })
  @IsOptional()
  @IsString()
  cnieNumber?: string

  @ApiPropertyOptional({ description: 'Additional document URLs for multi-page submissions', isArray: true })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalUrls?: string[]
}
