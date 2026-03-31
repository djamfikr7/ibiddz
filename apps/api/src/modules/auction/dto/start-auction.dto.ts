import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StartAuctionDto {
  @ApiProperty({ description: 'Starting price in DZD', example: 30000 })
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  startPrice: number;

  @ApiPropertyOptional({
    description: 'Reserve price in DZD (auction fails if not met)',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  reservePrice?: number;

  @ApiProperty({ description: 'Auction duration in minutes', example: 10 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;
}
