import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmCodDto } from './dto/confirm-cod.dto';
import {
  OrderResponseDto,
  MyOrderDto,
  SellerOrderDto,
  ShippingAddressDto,
  OrderItemDto,
} from './dto/order-response.dto';
import { COD, COURIER, COMMISSION } from '@ibiddz/shared';
import { Decimal } from '@prisma/client/runtime/library';

const DISPUTE_WINDOW_HOURS = 48;
const MAX_DELIVERY_ATTEMPTS = 3;
const RETURN_FEE_DZD = 1000;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly commissionService: CommissionService,
    @InjectQueue('settlement-queue') private readonly settlementQueue: Queue,
  ) {}

  generateCodToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < COD.TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  async createOrder(dto: CreateOrderDto, buyerId: string): Promise<OrderResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId === buyerId) {
      throw new BadRequestException('You cannot purchase your own listing');
    }

    if (listing.status !== 'SOLD' && listing.status !== 'ACTIVE') {
      throw new BadRequestException('Listing is not available for purchase');
    }

    const isBuyNow = listing.auctionType === 'BUY_NOW';
    const finalPrice = isBuyNow
      ? listing.buyNowPrice ?? listing.startingPrice
      : listing.currentBid ?? listing.startingPrice;

    const shippingCost = new Decimal(COURIER.STANDARD_DELIVERY);
    const totalAmount = new Decimal(finalPrice.toNumber() + shippingCost.toNumber());

    const codToken = this.generateCodToken();

    const shippingAddress: ShippingAddressDto = {
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      wilaya: dto.wilaya,
      city: dto.city ?? null,
      address: dto.address,
      deliveryNotes: dto.deliveryNotes ?? null,
    };

    const order = await this.prisma.order.create({
      data: {
        listingId: dto.listingId,
        buyerId,
        sellerId: listing.sellerId,
        finalPrice,
        commissionAmount: new Decimal(0),
        shippingCost,
        totalAmount,
        paymentMethod: dto.paymentMethod as any,
        codToken: dto.paymentMethod === 'COD' ? codToken : null,
        codAmount: dto.paymentMethod === 'COD' ? totalAmount : null,
        shippingAddress: shippingAddress as any,
        status: 'PENDING',
        metadata: {
          isBuyNow,
          deliveryAttempts: 0,
        },
      },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    if (listing.status !== 'SOLD') {
      await this.prisma.listing.update({
        where: { id: dto.listingId },
        data: { status: 'SOLD' },
      });
    }

    this.logger.log(
      `Order created: ${order.id} for listing ${dto.listingId}, buyer ${buyerId}, seller ${listing.sellerId}`,
    );

    return this.mapToOrderResponseDto(order);
  }

  async getBuyerOrders(buyerId: string): Promise<MyOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { buyerId },
      include: { listing: true, seller: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: this.generateOrderNumber(order),
      listingTitle: order.listing.title,
      listingCoverPhoto: order.listing.coverPhoto,
      sellerName: order.seller.displayName ?? 'Seller',
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      courierName: order.courierName ?? null,
      courierRef: order.courierRef ?? null,
      createdAt: order.createdAt,
    }));
  }

  async getSellerOrders(sellerId: string): Promise<SellerOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { sellerId },
      include: { listing: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const netToSeller = new Decimal(
        order.finalPrice.toNumber() -
        order.commissionAmount.toNumber() -
        order.shippingCost.toNumber(),
      );

      return {
        id: order.id,
        orderNumber: this.generateOrderNumber(order),
        listingTitle: order.listing.title,
        listingCoverPhoto: order.listing.coverPhoto,
        buyerName: order.buyer.displayName ?? 'Buyer',
        buyerPhone: order.buyer.phone,
        totalAmount: order.totalAmount,
        commissionAmount: order.commissionAmount,
        netToSeller,
        status: order.status,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress as any,
        courierName: order.courierName ?? null,
        createdAt: order.createdAt,
      };
    });
  }

  async confirmCod(dto: ConfirmCodDto, userId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('You can only confirm your own orders');
    }

    if (order.status !== 'SHIPPED' && order.status !== 'OUT_FOR_DELIVERY') {
      throw new BadRequestException(
        `Order is not in a deliverable state. Current status: ${order.status}`,
      );
    }

    if (!order.codToken) {
      throw new BadRequestException('This order does not use COD payment');
    }

    if (order.codToken !== dto.codToken.toUpperCase()) {
      throw new BadRequestException('Invalid COD verification token');
    }

    const now = new Date();
    const disputeWindowCloses = new Date(
      now.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: now,
        paidAt: now,
        metadata: {
          ...(order.metadata as Record<string, any>),
          disputeWindowClosesAt: disputeWindowCloses.toISOString(),
          codConfirmedAt: now.toISOString(),
        },
      },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    await this.settlementQueue.add('settlement:process', {
      orderId: updatedOrder.id,
      sellerId: updatedOrder.sellerId,
      finalPrice: updatedOrder.finalPrice.toNumber(),
    });

    this.logger.log(
      `COD confirmed for order ${dto.orderId}. Settlement queued.`,
    );

    return this.mapToOrderResponseDto(updatedOrder);
  }

  async getOrderDetail(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.mapToOrderResponseDto(order);
  }

  async markOrderAssigned(orderId: string, courierName: string, courierRef: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        courierName,
        courierRef,
        shippedAt: new Date(),
      },
    });

    this.logger.log(`Order ${orderId} assigned to ${courierName}, ref: ${courierRef}`);
  }

  async markOrderInTransit(orderId: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'OUT_FOR_DELIVERY' },
    });

    this.logger.log(`Order ${orderId} is now in transit / out for delivery`);
  }

  async markOrderDelivered(orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'DELIVERED') {
      return this.mapToOrderResponseDto(order);
    }

    const now = new Date();
    const disputeWindowCloses = new Date(
      now.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: now,
        paidAt: now,
        metadata: {
          ...(order.metadata as Record<string, any>),
          disputeWindowClosesAt: disputeWindowCloses.toISOString(),
        },
      },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    await this.settlementQueue.add('settlement:process', {
      orderId: updatedOrder.id,
      sellerId: updatedOrder.sellerId,
      finalPrice: updatedOrder.finalPrice.toNumber(),
    });

    this.logger.log(
      `Order ${orderId} marked as delivered. Settlement queued.`,
    );

    return this.mapToOrderResponseDto(updatedOrder);
  }

  async markOrderFailed(orderId: string, reason: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const meta = (order.metadata as Record<string, any>) || {};
    const deliveryAttempts = (meta.deliveryAttempts || 0) + 1;

    if (deliveryAttempts >= MAX_DELIVERY_ATTEMPTS) {
      const returnFee = RETURN_FEE_DZD;

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledReason: `Failed delivery after ${deliveryAttempts} attempts: ${reason}`,
          cancelledAt: new Date(),
          metadata: {
            ...meta,
            deliveryAttempts,
            returnFeeDeducted: true,
            returnFeeAmount: returnFee,
          },
        },
      });

      if (order.buyer.walletDZD.toNumber() >= returnFee) {
        try {
          await this.walletService.debitForFees(
            order.buyerId,
            returnFee,
            `Return shipping fee for failed delivery order ${orderId}`,
          );
        } catch (err) {
          this.logger.warn(
            `Could not deduct return fee from buyer ${order.buyerId}: ${err}`,
          );
        }
      }

      await this.prisma.listing.update({
        where: { id: order.listingId },
        data: { status: 'ACTIVE' },
      });

      this.logger.warn(
        `Order ${orderId} auto-returned after ${deliveryAttempts} failed attempts. Return fee: ${returnFee} DZD`,
      );
    } else {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PENDING',
          metadata: {
            ...meta,
            deliveryAttempts,
            lastFailReason: reason,
          },
        },
      });

      this.logger.warn(
        `Order ${orderId} delivery failed (attempt ${deliveryAttempts}/${MAX_DELIVERY_ATTEMPTS}): ${reason}`,
      );
    }
  }

  async processSettlement(orderId: string, sellerId: string, finalPrice: number): Promise<void> {
    const existingLedger = await this.prisma.commissionLedger.findFirst({
      where: { orderId },
    });

    if (existingLedger && existingLedger.settled) {
      this.logger.warn(`Settlement already processed for order ${orderId}`);
      return;
    }

    const ledger = await this.commissionService.createLedgerEntry(orderId);

    await this.commissionService.settleCommission(ledger.id);

    const commissionAmount = ledger.commissionAmount.toNumber();

    await this.walletService.creditOnSettlement(
      sellerId,
      finalPrice,
      commissionAmount,
    );

    await this.prisma.commissionLedger.update({
      where: { id: ledger.id },
      data: { settled: true, settledAt: new Date() },
    });

    this.logger.log(
      `Settlement processed for order ${orderId}: commission=${commissionAmount} DZD`,
    );
  }

  private generateOrderNumber(order: any): string {
    const date = new Date(order.createdAt);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const seq = order.id.slice(-6).toUpperCase();
    return `IBD-${year}${month}-${seq}`;
  }

  private mapToOrderResponseDto(order: any): OrderResponseDto {
    const meta = (order.metadata as Record<string, any>) || {};
    const disputeWindowClosesAt = meta.disputeWindowClosesAt
      ? new Date(meta.disputeWindowClosesAt)
      : null;
    const now = new Date();
    const disputeWindowOpen =
      order.status === 'DELIVERED' &&
      disputeWindowClosesAt &&
      now < disputeWindowClosesAt;

    const listingItem: OrderItemDto = {
      id: order.listing.id,
      listingId: order.listing.id,
      title: order.listing.title,
      model: order.listing.model,
      storageGB: order.listing.storageGB,
      color: order.listing.color,
      condition: order.listing.condition,
      coverPhoto: order.listing.coverPhoto,
    };

    return {
      id: order.id,
      orderNumber: this.generateOrderNumber(order),
      listing: listingItem,
      buyerId: order.buyerId,
      buyerPhone: order.buyer.phone,
      sellerId: order.sellerId,
      sellerPhone: order.seller.phone,
      finalPrice: order.finalPrice,
      commissionAmount: order.commissionAmount,
      shippingCost: order.shippingCost,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      codToken: order.codToken ?? null,
      status: order.status,
      shippingAddress: order.shippingAddress as any,
      courierName: order.courierName ?? null,
      courierRef: order.courierRef ?? null,
      shippedAt: order.shippedAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
      cancelledReason: order.cancelledReason ?? null,
      cancelledAt: order.cancelledAt ?? null,
      deliveryAttempts: meta.deliveryAttempts || 0,
      disputeWindowOpen: disputeWindowOpen ?? false,
      disputeWindowClosesAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
