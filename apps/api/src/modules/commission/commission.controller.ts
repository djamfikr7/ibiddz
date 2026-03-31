import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import { JwtGuard } from '../auth/jwt.guard';

@ApiTags('commission')
@Controller('v1/commission')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('estimate')
  @ApiOperation({ summary: 'Estimate commission for a sale' })
  @ApiQuery({ name: 'price', description: 'Sale price in DZD', type: Number })
  @ApiQuery({
    name: 'tier',
    description: 'User tier',
    enum: ['BASICO', 'PRO', 'CERTIFIE', 'ELITE'],
  })
  @ApiQuery({
    name: 'auction',
    description: 'Whether this is an auction sale',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Commission estimate calculated',
    schema: {
      properties: {
        price: { type: 'number', example: 100000 },
        tier: { type: 'string', example: 'PRO' },
        isAuction: { type: 'boolean', example: true },
        baseFee: { type: 'number', example: 3000 },
        tierDiscount: { type: 'number', example: 1.5 },
        auctionSurcharge: { type: 'number', example: 500 },
        finalCommission: { type: 'number', example: 3455 },
        netToSeller: { type: 'number', example: 96545 },
        capped: { type: 'boolean', example: false },
      },
    },
  })
  async estimateCommission(
    @Query('price') price: string,
    @Query('tier') tier: string,
    @Query('auction') auction?: string,
  ) {
    return this.commissionService.estimateCommission({
      price: parseFloat(price),
      tier: tier.toUpperCase(),
      auction: auction === 'true',
    });
  }

  @Get('ledger')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's commission history" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Commission ledger retrieved',
  })
  async getLedger(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionService.getUserLedger(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
