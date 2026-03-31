import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmCodDto } from './dto/confirm-cod.dto';
import { OrderResponseDto, MyOrderDto, SellerOrderDto } from './dto/order-response.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser, RequestUser } from '../../common/decorators/user.decorator';

@ApiTags('orders')
@Controller('v1')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post('orders')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create a new order (Buy Now or auction win)' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiBody({ type: CreateOrderDto })
  @ApiBearerAuth()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: RequestUser,
  ): Promise<OrderResponseDto> {
    this.logger.log(`User ${user.id} creating order for listing ${dto.listingId}`);
    return this.orderService.createOrder(dto, user.id);
  }

  @Get('orders/my')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get buyer's orders" })
  @ApiResponse({ status: 200, description: 'List of buyer orders', type: [MyOrderDto] })
  @ApiBearerAuth()
  async getMyOrders(
    @CurrentUser() user: RequestUser,
  ): Promise<MyOrderDto[]> {
    this.logger.log(`User ${user.id} fetching their orders`);
    return this.orderService.getBuyerOrders(user.id);
  }

  @Get('orders/seller')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get seller's orders" })
  @ApiResponse({ status: 200, description: 'List of seller orders', type: [SellerOrderDto] })
  @ApiBearerAuth()
  async getSellerOrders(
    @CurrentUser() user: RequestUser,
  ): Promise<SellerOrderDto[]> {
    this.logger.log(`User ${user.id} fetching seller orders`);
    return this.orderService.getSellerOrders(user.id);
  }

  /**
   * Blueprint endpoint: POST /v1/cod/confirm
   * Validate token, trigger payout
   */
  @Post('cod/confirm')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Validate COD token and trigger payout' })
  @ApiResponse({ status: 200, description: 'COD confirmed, payout triggered', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid COD token' })
  @ApiBody({ type: ConfirmCodDto })
  @ApiBearerAuth()
  async confirmCod(
    @Body() dto: ConfirmCodDto,
    @CurrentUser() user: RequestUser,
  ): Promise<OrderResponseDto> {
    this.logger.log(`COD confirmation for order ${dto.orderId} by user ${user.id}`);
    return this.orderService.confirmCod(dto, user.id);
  }

  @Get('orders/:id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiBearerAuth()
  async getOrder(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<OrderResponseDto> {
    this.logger.log(`User ${user.id} fetching order ${id}`);
    return this.orderService.getOrderDetail(id, user.id);
  }
}
