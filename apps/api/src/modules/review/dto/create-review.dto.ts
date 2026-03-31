import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsArray, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateReviewDto {
  @ApiProperty({ description: "ID of the user being reviewed (the seller)" })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ description: "ID of the completed order" })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: "Rating from 1 to 5 stars", minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: "Review tags",
    enum: ["accurate_description", "good_communication", "on_time", "fair_price", "responsive"],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Review comment", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Comment must not exceed 1000 characters" })
  comment?: string;
}
