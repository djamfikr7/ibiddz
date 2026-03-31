import { ApiProperty } from "@nestjs/swagger";

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  actionUrl: string | null;

  @ApiProperty()
  read: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  clicked: boolean;

  @ApiProperty({ nullable: true })
  clickedAt: Date | null;

  @ApiProperty()
  sent: boolean;

  @ApiProperty({ nullable: true })
  sentAt: Date | null;

  @ApiProperty()
  delivered: boolean;

  @ApiProperty({ nullable: true })
  deliveredAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
