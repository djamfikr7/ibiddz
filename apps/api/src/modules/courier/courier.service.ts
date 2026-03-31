import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { OrderService } from '../order/order.service';
import { CourierWebhookDto } from './dto/courier-webhook.dto';
import { CourierEvent } from '@ibiddz/shared';

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  private readonly webhookSecrets: Record<string, string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
    @InjectQueue('settlement-queue') private readonly settlementQueue: Queue,
  ) {
    this.webhookSecrets = {
      yalidine: this.configService.get<string>('YALIDINE_WEBHOOK_SECRET', ''),
      zr_express: this.configService.get<string>('ZR_EXPRESS_WEBHOOK_SECRET', ''),
    };
  }

  async processWebhook(dto: CourierWebhookDto, headerSignature?: string): Promise<{ success: boolean; message: string }> {
    const provider = dto.provider.toLowerCase();
    const secret = this.webhookSecrets[provider];

    if (secret && dto.signature) {
      if (!this.verifyWebhookSignature(dto, dto.signature, secret)) {
        this.logger.warn(`Invalid webhook signature from ${provider}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const order = await this.prisma.order.findFirst({
      where: { courierRef: dto.orderRef },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with courier ref ${dto.orderRef} not found`);
    }

    const existingWebhook = await this.prisma.courierWebhook.findFirst({
      where: {
        orderId: order.id,
        event: dto.event,
        processed: true,
      },
    });

    if (existingWebhook) {
      this.logger.log(
        `Duplicate webhook ignored for order ${order.id}, event ${dto.event}`,
      );
      return { success: true, message: 'Duplicate webhook ignored' };
    }

    await this.prisma.courierWebhook.create({
      data: {
        orderId: order.id,
        event: dto.event,
        payload: dto.payload as any,
        processed: false,
      },
    });

    switch (dto.event) {
      case CourierEvent.CREATED:
        await this.handleCreated(order.id, dto);
        break;
      case CourierEvent.PICKED_UP:
        await this.handlePickedUp(order.id, dto);
        break;
      case CourierEvent.IN_TRANSIT:
        await this.handleInTransit(order.id, dto);
        break;
      case CourierEvent.DELIVERED:
        await this.handleDelivered(order.id, dto);
        break;
      case CourierEvent.FAILED:
        await this.handleFailed(order.id, dto);
        break;
      default:
        this.logger.warn(`Unknown courier event: ${dto.event}`);
    }

    await this.prisma.courierWebhook.updateMany({
      where: {
        orderId: order.id,
        event: dto.event,
        processed: false,
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Webhook processed: ${dto.event} for order ${order.id}`,
    };
  }

  async assignCourier(
    orderId: string,
    courierName: string,
    courierRef: string,
    userId: string,
  ): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order must be in PENDING status to assign courier. Current: ${order.status}`,
      );
    }

    await this.orderService.markOrderAssigned(orderId, courierName, courierRef);

    const label = this.generateShippingLabel(order, courierName, courierRef);

    return {
      success: true,
      orderId,
      courierName,
      courierRef,
      shippingLabel: label,
    };
  }

  async getCourierDeliveryQueue(
    courierName: string,
    status?: string,
  ): Promise<any[]> {
    const whereClause: Record<string, any> = {
      courierName,
    };

    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = {
        in: ['SHIPPED', 'OUT_FOR_DELIVERY'],
      };
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            model: true,
            coverPhoto: true,
          },
        },
        buyer: {
          select: {
            id: true,
            displayName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: `IBD-${order.id.slice(-6).toUpperCase()}`,
      listingTitle: order.listing.title,
      listingModel: order.listing.model,
      buyerName: order.buyer.displayName ?? 'Buyer',
      buyerPhone: order.buyer.phone,
      shippingAddress: order.shippingAddress,
      status: order.status,
      courierRef: order.courierRef,
      shippedAt: order.shippedAt,
      createdAt: order.createdAt,
    }));
  }

  private async handleCreated(orderId: string, dto: CourierWebhookDto): Promise<void> {
    this.logger.log(`Courier CREATED event for order ${orderId}`);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(await this.getExistingMetadata(orderId)),
          courierCreatedAt: new Date().toISOString(),
          courierProvider: dto.provider,
        },
      },
    });
  }

  private async handlePickedUp(orderId: string, dto: CourierWebhookDto): Promise<void> {
    this.logger.log(`Courier PICKED_UP event for order ${orderId}`);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        metadata: {
          ...(await this.getExistingMetadata(orderId)),
          pickedUpAt: new Date().toISOString(),
        },
      },
    });
  }

  private async handleInTransit(orderId: string, dto: CourierWebhookDto): Promise<void> {
    this.logger.log(`Courier IN_TRANSIT event for order ${orderId}`);
    await this.orderService.markOrderInTransit(orderId);
  }

  private async handleDelivered(orderId: string, dto: CourierWebhookDto): Promise<void> {
    this.logger.log(`Courier DELIVERED event for order ${orderId}`);
    const order = await this.orderService.markOrderDelivered(orderId);

    await this.settlementQueue.add('settlement:process', {
      orderId: order.id,
      sellerId: order.sellerId,
      finalPrice: order.finalPrice.toNumber(),
    });
  }

  private async handleFailed(orderId: string, dto: CourierWebhookDto): Promise<void> {
    const reason = (dto.payload?.reason as string) ?? 'Delivery attempt failed';
    this.logger.warn(`Courier FAILED event for order ${orderId}: ${reason}`);
    await this.orderService.markOrderFailed(orderId, reason);
  }

  private verifyWebhookSignature(
    dto: CourierWebhookDto,
    signature: string,
    secret: string,
  ): boolean {
    const payloadString = JSON.stringify({
      provider: dto.provider,
      event: dto.event,
      orderRef: dto.orderRef,
      payload: dto.payload,
    });

    const computedHmac = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(computedHmac),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  private generateShippingLabel(
    order: any,
    courierName: string,
    courierRef: string,
  ): string {
    const address = order.shippingAddress as Record<string, any>;
    const labelData = {
      courier: courierName,
      trackingNumber: courierRef,
      orderId: order.id,
      recipient: {
        name: address?.recipientName ?? '',
        phone: address?.recipientPhone ?? '',
        address: address?.address ?? '',
        city: address?.city ?? '',
        wilaya: address?.wilaya ?? '',
      },
      sender: {
        name: order.seller.displayName ?? 'Seller',
        phone: order.seller.phone,
        wilaya: order.listing.wilaya,
      },
      item: {
        title: order.listing.title,
        model: order.listing.model,
        codAmount: order.codAmount?.toString() ?? '0',
      },
      generatedAt: new Date().toISOString(),
    };

    const labelContent = Buffer.from(JSON.stringify(labelData)).toString('base64');
    return `data:application/pdf;base64,${labelContent}`;
  }

  private async getExistingMetadata(orderId: string): Promise<Record<string, any>> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { metadata: true },
    });
    return (order?.metadata as Record<string, any>) || {};
  }
}
