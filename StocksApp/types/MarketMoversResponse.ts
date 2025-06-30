import { Ticker } from '@/types/Ticker'

export interface MarketMoversResponse {
  top_gainers: Ticker[];
  top_losers: Ticker[];

}