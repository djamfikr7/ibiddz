import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Headers,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CourierService } from './courier.service';
import { CourierWebhookDto } from './dto/courier-webhook.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser, RequestUser } from '../../common/decorators/user.decorator';

@ApiTags('courier')
@Controller('v1/webhooks')
export class CourierController {
  private readonly logger = new Logger(CourierController.name);

  constructor(private readonly courierService: CourierService) {}

  /**
   * Blueprint endpoint: POST /v1/webhooks/courier
   * Delivery status sync from courier partners
   */
  @Post('courier')
  @ApiOperation({ summary: 'Receive courier webhooks (Yalidine, ZR Express)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload or signature' })
  @ApiBody({ type: CourierWebhookDto })
  async handleWebhook(
    @Body() dto: CourierWebhookDto,
    @Headers('x-webhook-signature') signature: string,
  ) {
    this.logger.log(
      `Received webhook from ${dto.provider}: event=${dto.event}, orderRef=${dto.orderRef}`,
    );
    return this.courierService.processWebhook(dto, signature);
  }

  @Post('assign')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign courier to an order' })
  @ApiResponse({ status: 200, description: 'Courier assigned successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async assignCourier(
    @Body() body: { orderId: string; courierName: string; courierRef: string },
    @CurrentUser() user: RequestUser,
  ) {
    this.logger.log(
      `Assigning courier ${body.courierName} to order ${body.orderId}`,
    );
    return this.courierService.assignCourier(
      body.orderId,
      body.courierName,
      body.courierRef,
      user.id,
    );
  }

  @Get('orders')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get courier's delivery queue" })
  @ApiResponse({ status: 200, description: 'List of orders for courier' })
  async getCourierOrders(
    @Query('courierName') courierName: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(`Fetching delivery queue for courier: ${courierName}`);
    return this.courierService.getCourierDeliveryQueue(courierName, status);
  }
}
