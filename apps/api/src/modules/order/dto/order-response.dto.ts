import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class ShippingAddressDto {
  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  recipientPhone: string;

  @ApiProperty()
  wilaya: string;

  @ApiProperty({ nullable: true })
  city: string | null;

  @ApiProperty()
  address: string;

  @ApiProperty({ nullable: true })
  deliveryNotes: string | null;
}

export class OrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  listingId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  storageGB: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  condition: string;

  @ApiProperty()
  coverPhoto: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  listing: OrderItemDto;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  buyerPhone: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  sellerPhone: string;

  @ApiProperty()
  finalPrice: Decimal;

  @ApiProperty()
  commissionAmount: Decimal;

  @ApiProperty()
  shippingCost: Decimal;

  @ApiProperty()
  totalAmount: Decimal;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty({ nullable: true })
  codToken: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ nullable: true })
  courierName: string | null;

  @ApiProperty({ nullable: true })
  courierRef: string | null;

  @ApiProperty({ nullable: true })
  shippedAt: Date | null;

  @ApiProperty({ nullable: true })
  deliveredAt: Date | null;

  @ApiProperty({ nullable: true })
  cancelledReason: string | null;

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty()
  deliveryAttempts: number;

  @ApiProperty()
  disputeWindowOpen: boolean;

  @ApiProperty({ nullable: true })
  disputeWindowClosesAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MyOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  listingTitle: string;

  @ApiProperty()
  listingCoverPhoto: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  totalAmount: Decimal;

  @ApiProperty()
  status: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty({ nullable: true })
  courierName: string | null;

  @ApiProperty({ nullable: true })
  courierRef: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class SellerOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  listingTitle: string;

  @ApiProperty()
  listingCoverPhoto: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  buyerPhone: string;

  @ApiProperty()
  totalAmount: Decimal;

  @ApiProperty()
  commissionAmount: Decimal;

  @ApiProperty()
  netToSeller: Decimal;

  @ApiProperty()
  status: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ nullable: true })
  courierName: string | null;

  @ApiProperty()
  createdAt: Date;
}
