import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtGuard } from "../auth/jwt.guard";
import { PaginationQueryDto } from "../../common/dtos/pagination.dto";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll("user-id", query);
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id, "user-id");
  }

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async create(@Body() body: { listingId: string; [key: string]: any }) {
    return this.ordersService.create("user-id", body.listingId, body);
  }

  @Patch(":id/status")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, "user-id", body.status);
  }
}
