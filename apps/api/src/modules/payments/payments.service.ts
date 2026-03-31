import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentsService {
  async initiatePayment(orderId: string, userId: string, method: string) {
    return null;
  }

  async handleWebhook(provider: string, payload: any) {
    return null;
  }

  async requestWithdrawal(userId: string, amount: number, method: string, details: any) {
    return null;
  }

  async getBalance(userId: string) {
    return { available: 0, pending: 0, total: 0 };
  }
}
