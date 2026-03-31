import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ListingsService } from "./listings.service";
import { JwtGuard } from "../auth/jwt.guard";
import { PaginationQueryDto } from "../../common/dtos/pagination.dto";

@ApiTags("listings")
@Controller("listings")
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.listingsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async create(@Body() data: any) {
    return this.listingsService.create("user-id", data);
  }

  @Patch(":id")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async update(@Param("id") id: string, @Body() data: any) {
    return this.listingsService.update(id, "user-id", data);
  }

  @Delete(":id")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async delete(@Param("id") id: string) {
    return this.listingsService.delete(id, "user-id");
  }
}
