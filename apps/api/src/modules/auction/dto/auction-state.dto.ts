export class AuctionStateDto {
  auctionId: string;
  listingId: string;
  status: 'SCHEDULED' | 'LIVE' | 'EXTENDED' | 'ENDED' | 'CANCELLED';
  currentPrice: number;
  startPrice: number;
  reservePrice: number | null;
  timeRemaining: number;
  bidCount: number;
  highestBidderId: string | null;
  endsAt: Date;
  extended: boolean;
}
