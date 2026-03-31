import { IsString, IsOptional, IsInt, Min, Max, IsUrl, IsArray, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Display name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string

  @ApiPropertyOptional({ description: 'Profile avatar URL' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string

  @ApiPropertyOptional({ description: 'User bio', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string

  @ApiPropertyOptional({ description: 'Wilaya (Algerian state)' })
  @IsOptional()
  @IsString()
  wilaya?: string

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string

  @ApiPropertyOptional({ description: 'Notification preferences', type: 'object' })
  @IsOptional()
  notificationPreferences?: Record<string, boolean>

  @ApiPropertyOptional({ description: 'Privacy settings', type: 'object' })
  @IsOptional()
  privacySettings?: Record<string, boolean>
}
