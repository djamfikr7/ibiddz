import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlaceBidDto {
  @ApiProperty({ description: 'Bid amount in DZD', example: 50000 })
  @IsNumber()
  @Min(100)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Maximum proxy bid amount in DZD',
    example: 75000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  proxyMax?: number;
}
