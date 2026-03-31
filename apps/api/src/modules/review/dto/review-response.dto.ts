import { ApiProperty } from "@nestjs/swagger";

export class ReviewerInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  role: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  reviewerId: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ nullable: true })
  tags: string[] | null;

  @ApiProperty({ nullable: true })
  comment: string | null;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  flagged: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => ReviewerInfoDto })
  reviewer: ReviewerInfoDto;
}
