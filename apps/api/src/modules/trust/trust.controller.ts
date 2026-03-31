import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { JwtGuard } from '../auth/jwt.guard';

@ApiTags('trust')
@Controller('v1/user')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('trust')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user trust score with breakdown' })
  @ApiResponse({
    status: 200,
    description: 'Trust score retrieved successfully',
    schema: {
      properties: {
        score: { type: 'number', example: 75 },
        tier: { type: 'string', example: 'TRUSTED' },
        badge: { type: 'string', example: '✅ Trusted Seller' },
        color: { type: 'string', example: '#4CAF50' },
        components: {
          type: 'object',
          properties: {
            reviewRating: { type: 'number', example: 80 },
            codCompletion: { type: 'number', example: 90 },
            disputePenalty: { type: 'number', example: 0 },
            verificationBonus: { type: 'number', example: 20 },
            accountAgeFactor: { type: 'number', example: 12 },
          },
        },
        nextTierScore: { type: 'number', example: 88 },
        nextTierName: { type: 'string', example: 'ELITE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyTrust(@Req() req: any) {
    return this.trustService.getTrustScore(req.user.userId);
  }

  @Get(':id/trust')
  @ApiOperation({ summary: 'Get public trust view for a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Public trust information retrieved',
    schema: {
      properties: {
        score: { type: 'number', example: 75 },
        tier: { type: 'string', example: 'TRUSTED' },
        badge: { type: 'string', example: '✅ Trusted Seller' },
        color: { type: 'string', example: '#4CAF50' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicTrust(@Param('id') userId: string) {
    const breakdown = await this.trustService.getTrustScore(userId);
    return {
      score: breakdown.score,
      tier: breakdown.tier,
      badge: breakdown.badge,
      color: breakdown.color,
    };
  }
}
