'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { auctionsApi } from '@/lib/api';

interface Bid {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  bidType: 'MANUAL' | 'PROXY' | 'AUTO';
  createdAt: string;
  isWinning?: boolean;
}

interface AuctionData {
  id: string;
  title: string;
  currentBid: number;
  startingPrice: number;
  buyNowPrice?: number;
  endTime: string;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  bidCount: number;
  bidderCount: number;
  photos: string[];
  seller: {
    id: string;
    displayName?: string;
    trustScore: number;
  };
  hasBuyNow: boolean;
  antiSniping: boolean;
  antiSnipingSeconds: number;
}

export function useAuction(auctionId: string) {
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isWinning, setIsWinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connect, on, off, emit } = useSocket();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setIsLoading(true);
        const { data } = await auctionsApi.getById(auctionId);
        setAuction(data);

        const endTime = new Date(data.endTime).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, endTime - now));

        if (data.bids) {
          setBids(data.bids);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load auction');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId]);

  useEffect(() => {
    if (!auction?.endTime) return;

    const updateTimer = () => {
      const endTime = new Date(auction.endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining <= 0 && auction.status === 'LIVE') {
        setAuction((prev) => prev ? { ...prev, status: 'ENDED' } : null);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [auction?.endTime, auction?.status]);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  useEffect(() => {
    if (!auctionId || !isConnected) return;

    const roomName = `auction:${auctionId}`;
    emit('join-auction', { auctionId });

    const handleNewBid = (bid: Bid) => {
      setBids((prev) => [bid, ...prev]);
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentBid: bid.amount,
              bidCount: prev.bidCount + 1,
            }
          : null
      );

      if (bid.userId === 'current-user') {
        setIsWinning(true);
      } else {
        setIsWinning(false);
      }
    };

    const handleAuctionExtended = (data: { newEndTime: string; addedSeconds: number }) => {
      setAuction((prev) =>
        prev ? { ...prev, endTime: data.newEndTime } : null
      );
    };

    const handleAuctionEnded = (data: { winnerId: string; winningBid: number }) => {
      setAuction((prev) =>
        prev ? { ...prev, status: 'ENDED', currentBid: data.winningBid } : null
      );
      setIsWinning(data.winnerId === 'current-user');
    };

    const cleanup1 = on('new-bid', handleNewBid);
    const cleanup2 = on('auction-extended', handleAuctionExtended);
    const cleanup3 = on('auction-ended', handleAuctionEnded);

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      emit('leave-auction', { auctionId });
    };
  }, [auctionId, isConnected, on, off, emit]);

  const placeBid = useCallback(
    async (amount: number) => {
      try {
        const response = await auctionsApi.placeBid(auctionId, amount);
        emit('place-bid', { auctionId, amount, bidId: response.data.id });
        return { success: true, data: response.data };
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.message || 'Failed to place bid',
        };
      }
    },
    [auctionId, emit]
  );

  const setProxyBid = useCallback(
    async (maxAmount: number) => {
      try {
        const response = await auctionsApi.setProxyBid(auctionId, maxAmount);
        emit('set-proxy-bid', { auctionId, maxAmount });
        return { success: true, data: response.data };
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.message || 'Failed to set proxy bid',
        };
      }
    },
    [auctionId, emit]
  );

  const formatTimeLeft = useCallback(() => {
    if (timeLeft <= 0) return '00:00:00';
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const isAntiSnipingActive = timeLeft > 0 && timeLeft <= (auction?.antiSnipingSeconds || 30) * 1000;

  return {
    auction,
    bids,
    timeLeft,
    timeLeftFormatted: formatTimeLeft(),
    isWinning,
    isLoading,
    error,
    isConnected,
    isAntiSnipingActive,
    placeBid,
    setProxyBid,
  };
}
