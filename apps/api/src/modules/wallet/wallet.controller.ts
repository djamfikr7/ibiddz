import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsObject, IsEnum } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../auth/jwt.guard';

class WithdrawDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(['CCP', 'EDAHABIA', 'BANK'])
  method: string;

  @IsObject()
  payoutDetails: Record<string, any>;
}

class BuyCreditsDto {
  @IsNumber()
  @Min(1)
  creditCount: number;

  @IsNumber()
  @Min(1)
  pricePerCredit: number;
}

@ApiTags('wallet')
@Controller('v1/wallet')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved',
    schema: {
      properties: {
        available: { type: 'number', example: 45000 },
        locked: { type: 'number', example: 5000 },
        total: { type: 'number', example: 50000 },
      },
    },
  })
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved',
  })
  async getTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal to CCP/EDAHABIA/Bank' })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created',
    schema: {
      properties: {
        requestId: { type: 'string' },
        amount: { type: 'number' },
        fee: { type: 'number' },
        netAmount: { type: 'number' },
        status: { type: 'string', example: 'PENDING' },
        estimatedProcessing: { type: 'string', format: 'date-time' },
      },
    },
  })
  async requestWithdraw(@Req() req: any, @Body() dto: WithdrawDto) {
    return this.walletService.requestWithdrawal(
      req.user.userId,
      dto.amount,
      dto.method,
      dto.payoutDetails,
    );
  }

  @Post('buy-credits')
  @ApiOperation({ summary: 'Purchase broadcast credits' })
  @ApiResponse({
    status: 201,
    description: 'Credits purchased successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        creditsPurchased: { type: 'number' },
        totalCost: { type: 'number' },
        newBalance: { type: 'number' },
      },
    },
  })
  async buyCredits(@Req() req: any, @Body() dto: BuyCreditsDto) {
    return this.walletService.purchaseCredits(
      req.user.userId,
      dto.creditCount,
      dto.pricePerCredit,
    );
  }
}
