import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierEvent } from '@ibiddz/shared';

export class CourierWebhookDto {
  @ApiProperty({
    description: 'Courier provider name',
    example: 'yalidine',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    description: 'Webhook event type',
    enum: CourierEvent,
    example: 'DELIVERED',
  })
  @IsEnum(CourierEvent)
  @IsNotEmpty()
  event: CourierEvent;

  @ApiProperty({
    description: 'Order reference / tracking number',
    example: 'YAL-12345678',
  })
  @IsString()
  @IsNotEmpty()
  orderRef: string;

  @ApiPropertyOptional({
    description: 'Additional event payload from courier',
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'HMAC signature for webhook verification',
  })
  @IsString()
  @IsOptional()
  signature?: string;
}
