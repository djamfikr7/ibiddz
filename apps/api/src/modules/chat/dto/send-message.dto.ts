import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content!: string

  @ApiPropertyOptional({ enum: MessageType, description: 'Message type', default: 'TEXT' })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType

  @ApiPropertyOptional({ description: 'Image URL (for IMAGE type messages)' })
  @IsOptional()
  @IsString()
  imageUrl?: string
}
