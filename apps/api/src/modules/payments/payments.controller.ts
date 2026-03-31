import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { JwtGuard } from "../auth/jwt.guard";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("initiate")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async initiatePayment(@Body() body: { orderId: string; method: string }) {
    return this.paymentsService.initiatePayment(body.orderId, "user-id", body.method);
  }

  @Post("webhook/:provider")
  async handleWebhook(@Param("provider") provider: string, @Body() payload: any) {
    return this.paymentsService.handleWebhook(provider, payload);
  }

  @Post("withdraw")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async requestWithdrawal(@Body() body: { amount: number; method: string; details: any }) {
    return this.paymentsService.requestWithdrawal("user-id", body.amount, body.method, body.details);
  }

  @Get("balance")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async getBalance() {
    return this.paymentsService.getBalance("user-id");
  }
}
