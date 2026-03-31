import { IsEnum, IsString, IsOptional, IsArray, IsUrl, IsNotEmpty, MaxLength, IsObject, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { BroadcastChannel } from "@ibiddz/shared";

export class AudienceFilterDto {
  @ApiPropertyOptional({ description: "Target followers of specific users" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  followerOfUserIds?: string[];

  @ApiPropertyOptional({ description: "Target watchers of specific listings" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  watcherOfListingIds?: string[];

  @ApiPropertyOptional({ description: "Target users with specific items in wishlist" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wishlistModelMatches?: string[];

  @ApiPropertyOptional({ description: "Target by role" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ description: "Target by wilaya" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wilayas?: string[];

  @ApiPropertyOptional({ description: "Minimum trust score" })
  @IsOptional()
  trustScoreMin?: number;
}

export class CreateBroadcastDto {
  @ApiProperty({ enum: BroadcastChannel, description: "Broadcast channel" })
  @IsEnum(BroadcastChannel)
  @IsNotEmpty()
  channel: BroadcastChannel;

  @ApiProperty({ description: "Audience type: ALL, FOLLOWERS, WATCHERS, WISHLIST, CUSTOM" })
  @IsString()
  @IsNotEmpty()
  audienceType: string;

  @ApiPropertyOptional({ description: "Audience filter criteria" })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  @IsObject()
  audienceFilter?: AudienceFilterDto;

  @ApiPropertyOptional({ description: "Explicit list of recipient user IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientIds?: string[];

  @ApiProperty({ description: "Broadcast title" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: "Broadcast content/body" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: "Media URL (image/video)" })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: "Action URL / deep link" })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({ description: "Scheduled delivery time (ISO string)" })
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
