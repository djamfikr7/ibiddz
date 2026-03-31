import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmCodDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: '6-character COD verification token',
    example: 'A3F9K2',
    maxLength: 6,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  codToken: string;
}
