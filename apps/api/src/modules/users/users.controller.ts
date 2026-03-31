import { Controller, Get, Param, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtGuard } from "../auth/jwt.guard";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  async getPublicProfile(@Param("id") id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Patch("profile")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async updateProfile(@Body() data: any) {
    return this.usersService.updateProfile("user-id", data);
  }
}
