import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtGuard } from "../auth/jwt.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@ibiddz/shared";

@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("listings/pending")
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getPendingListings() {
    return this.adminService.getPendingListings();
  }

  @Patch("listings/:id/approve")
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async approveListing(@Param("id") id: string) {
    return this.adminService.approveListing(id);
  }

  @Patch("listings/:id/reject")
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async rejectListing(@Param("id") id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectListing(id, body.reason);
  }

  @Patch("users/:id/ban")
  @Roles(UserRole.ADMIN)
  async banUser(@Param("id") id: string, @Body() body: { reason: string }) {
    return this.adminService.banUser(id, body.reason);
  }

  @Post("broadcast")
  @Roles(UserRole.ADMIN)
  async broadcastMessage(@Body() body: { channel: string; content: string }) {
    return this.adminService.broadcastMessage(body.channel, body.content);
  }
}
