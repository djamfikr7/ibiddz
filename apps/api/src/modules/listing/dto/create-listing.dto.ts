import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsArray,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsDateString,
  ValidateIf,
  Length,
  Matches,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { CONDITION_GRADES, IMAGE_LIMITS } from '@ibiddz/shared'

export type ConditionGrade = keyof typeof CONDITION_GRADES

export const CONDITION_GRADE_VALUES = Object.keys(
  CONDITION_GRADES,
) as ConditionGrade[]

export class CreateListingDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max 256GB' })
  @IsString()
  @Length(5, 120)
  title: string

  @ApiProperty({ example: 'Excellent condition, barely used, includes original box and charger' })
  @IsString()
  @Length(10, 2000)
  description: string

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @Length(3, 100)
  model: string

  @ApiProperty({ example: 256, enum: [64, 128, 256, 512, 1024] })
  @IsInt()
  @Min(64)
  @Max(1024)
  @Type(() => Number)
  storageGB: number

  @ApiProperty({ example: 'Natural Titanium' })
  @IsString()
  @Length(1, 50)
  color: string

  @ApiProperty({ enum: CONDITION_GRADE_VALUES, example: 'EXCELLENT' })
  @IsEnum(CONDITION_GRADE_VALUES, {
    message: `Condition must be one of: ${CONDITION_GRADE_VALUES.join(', ')}`,
  })
  condition: ConditionGrade

  @ApiProperty({ example: 89, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  batteryHealth: number

  @ApiProperty({ example: '353456789012345' })
  @IsString()
  @Length(15, 17)
  @Matches(/^\d{15,17}$/, { message: 'IMEI must be 15-17 digits' })
  imei: string

  @ApiProperty({ example: 95000 })
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  startingPrice: number

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  buyNowPrice?: number

  @ApiPropertyOptional({ example: 90000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  reservePrice?: number

  @ApiProperty({ example: ['https://res.cloudinary.com/...', 'https://res.cloudinary.com/...'] })
  @IsArray()
  @IsUrl({}, { each: true })
  photos: string[]

  @ApiProperty({ example: 'Alger' })
  @IsString()
  @Length(2, 50)
  wilaya: string

  @ApiPropertyOptional({ example: 'Bab Ezzouar' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string

  @ApiPropertyOptional({ example: ['Charger', 'Case', 'Original Box'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessories?: string[]

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  originalBox?: boolean

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36)
  @Type(() => Number)
  warrantyRemaining?: number

  @ApiPropertyOptional({ enum: ['LIVE', 'TIMED', 'BUY_NOW', 'OFFER'], default: 'BUY_NOW' })
  @IsOptional()
  @IsEnum(['LIVE', 'TIMED', 'BUY_NOW', 'OFFER'])
  auctionType?: 'LIVE' | 'TIMED' | 'BUY_NOW' | 'OFFER'

  @ApiPropertyOptional({ example: '2024-03-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  auctionStart?: string

  @ApiPropertyOptional({ example: '2024-03-16T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  auctionEnd?: string

  @ApiPropertyOptional({ example: 1440 })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(10080)
  @Type(() => Number)
  durationMinutes?: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasBuyNow?: boolean

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  acceptOffers?: boolean

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../video.mp4' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string
}
