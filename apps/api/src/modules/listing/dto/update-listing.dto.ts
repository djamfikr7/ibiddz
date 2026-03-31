import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { CreateListingDto } from './create-listing.dto'
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUrl,
  IsBoolean,
  IsEnum,
  IsNumber,
  Length,
} from 'class-validator'
import { Type } from 'class-transformer'
import { IMAGE_LIMITS, CONDITION_GRADES } from '@ibiddz/shared'

export type ConditionGrade = keyof typeof CONDITION_GRADES

export const CONDITION_GRADE_VALUES = Object.keys(
  CONDITION_GRADES,
) as ConditionGrade[]

export class UpdateListingDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max 256GB - Price Drop!' })
  @IsOptional()
  @IsString()
  @Length(5, 120)
  title?: string

  @ApiPropertyOptional({ example: 'Updated description with more details' })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string

  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  model?: string

  @ApiPropertyOptional({ example: 256 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(1024)
  @Type(() => Number)
  storageGB?: number

  @ApiPropertyOptional({ example: 'Natural Titanium' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string

  @ApiPropertyOptional({ enum: CONDITION_GRADE_VALUES })
  @IsOptional()
  @IsEnum(CONDITION_GRADE_VALUES, {
    message: `Condition must be one of: ${CONDITION_GRADE_VALUES.join(', ')}`,
  })
  condition?: ConditionGrade

  @ApiPropertyOptional({ example: 89 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  batteryHealth?: number

  @ApiPropertyOptional({ example: 90000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  startingPrice?: number

  @ApiPropertyOptional({ example: 115000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  buyNowPrice?: number

  @ApiPropertyOptional({ example: 85000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  reservePrice?: number

  @ApiPropertyOptional({ example: ['https://res.cloudinary.com/...'] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[]

  @ApiPropertyOptional({ example: 'Alger' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  wilaya?: string

  @ApiPropertyOptional({ example: 'Bab Ezzouar' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessories?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  originalBox?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36)
  @Type(() => Number)
  warrantyRemaining?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'REMOVED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'REMOVED'])
  status?: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'REMOVED'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(10, 500)
  rejectionReason?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string
}
