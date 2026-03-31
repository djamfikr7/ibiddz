import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuctionsService } from "./auctions.service";
import { JwtGuard } from "../auth/jwt.guard";
import { PaginationQueryDto } from "../../common/dtos/pagination.dto";

@ApiTags("auctions")
@Controller("auctions")
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.auctionsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.auctionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.auctionsService.create("user-id", data);
  }

  @Post(":id/bid")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async placeBid(@Param("id") id: string, @Body() body: { amount: number }) {
    return this.auctionsService.placeBid(id, "user-id", body.amount);
  }
}
