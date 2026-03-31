import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsNumber,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CONDITION_GRADES } from '@ibiddz/shared'

export type ConditionGrade = keyof typeof CONDITION_GRADES
export const CONDITION_GRADE_VALUES = Object.keys(CONDITION_GRADES) as ConditionGrade[]

export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'REMOVED' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED'
export const LISTING_STATUS_VALUES: ListingStatus[] = ['ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'REMOVED', 'PENDING_APPROVAL', 'DRAFT', 'REJECTED']

export type SortField = 'createdAt' | 'price' | 'batteryHealth' | 'trustScore' | 'viewCount'
export const SORT_FIELD_VALUES: SortField[] = ['createdAt', 'price', 'batteryHealth', 'trustScore', 'viewCount']

export type SortOrder = 'asc' | 'desc'
export const SORT_ORDER_VALUES: SortOrder[] = ['asc', 'desc']

export class ListingQueryDto {
  @ApiPropertyOptional({ example: 'iPhone 15' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max' })
  @IsOptional()
  @IsString()
  model?: string

  @ApiPropertyOptional({ example: 256 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(1024)
  @Type(() => Number)
  storageGB?: number

  @ApiPropertyOptional({ enum: CONDITION_GRADE_VALUES })
  @IsOptional()
  @IsEnum(CONDITION_GRADE_VALUES)
  condition?: ConditionGrade

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minBatteryHealth?: number

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxBatteryHealth?: number

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number

  @ApiPropertyOptional({ example: 'Alger' })
  @IsOptional()
  @IsString()
  wilaya?: string

  @ApiPropertyOptional({ enum: LISTING_STATUS_VALUES, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(LISTING_STATUS_VALUES)
  status?: ListingStatus

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsString()
  featured?: string

  @ApiPropertyOptional({ enum: SORT_FIELD_VALUES, default: 'createdAt' })
  @IsOptional()
  @IsEnum(SORT_FIELD_VALUES)
  sortBy?: SortField

  @ApiPropertyOptional({ enum: SORT_ORDER_VALUES, default: 'desc' })
  @IsOptional()
  @IsEnum(SORT_ORDER_VALUES)
  sortOrder?: SortOrder

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number

  @ApiPropertyOptional({ example: 'cursor-token-here' })
  @IsOptional()
  @IsString()
  cursor?: string
}
