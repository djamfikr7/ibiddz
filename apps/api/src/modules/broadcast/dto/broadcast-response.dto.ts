import { ApiProperty } from "@nestjs/swagger";

export class RecipientAnalyticsDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  delivered: boolean;

  @ApiProperty({ nullable: true })
  deliveredAt: Date | null;

  @ApiProperty()
  opened: boolean;

  @ApiProperty({ nullable: true })
  openedAt: Date | null;

  @ApiProperty()
  clicked: boolean;

  @ApiProperty({ nullable: true })
  clickedAt: Date | null;

  @ApiProperty()
  converted: boolean;

  @ApiProperty({ nullable: true })
  convertedAt: Date | null;
}

export class BroadcastAnalyticsDto {
  @ApiProperty()
  sentCount: number;

  @ApiProperty()
  deliveredCount: number;

  @ApiProperty()
  openedCount: number;

  @ApiProperty()
  clickedCount: number;

  @ApiProperty()
  convertedCount: number;

  @ApiProperty({ type: [RecipientAnalyticsDto] })
  recipients: RecipientAnalyticsDto[];
}

export class BroadcastResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  audienceType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ nullable: true })
  mediaUrl: string | null;

  @ApiProperty({ nullable: true })
  actionUrl: string | null;

  @ApiProperty()
  creditCost: number;

  @ApiProperty()
  creditsDeducted: boolean;

  @ApiProperty({ nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ nullable: true })
  sentAt: Date | null;

  @ApiProperty()
  sentCount: number;

  @ApiProperty()
  deliveredCount: number;

  @ApiProperty()
  openedCount: number;

  @ApiProperty()
  clickedCount: number;

  @ApiProperty()
  convertedCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true, type: () => BroadcastAnalyticsDto })
  analytics?: BroadcastAnalyticsDto | null;
}
