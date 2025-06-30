// src/services/api.ts
import axios from 'axios';
import { mockOverviews, mockQuotes, mockMovers, sharedMockTimeSeries } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCache, setCache } from '../services/cache';

import { MarketMoversResponse } from '@/types/MarketMoversResponse';

// const ALPHA_API_KEY = '6NOENB8KBNH1KYMM';
const ALPHA_API_KEY='6FVVUERFCLSQTK2B';
const LOGOS_API_KEY = 'ODQdE9wOzbweM7kf5UDlXw==WAv6koN4RveTAykO';
const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';
const LOGOS_BASE_URL = 'https://api.api-ninjas.com/v1/logo';

const USE_MOCK_DATA = true;

export async function fetchLogos(ticker: string): Promise<any> {
  const cacheKey = `logo_${ticker}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(LOGOS_BASE_URL, {
      params: {
        ticker,
      },
      headers: {
        'X-Api-key': LOGOS_API_KEY,
      },
    });

    const logoData = response.data;
    await setCache(cacheKey, logoData, 24 * 60 * 60 * 1000); // cache for 24 hours
    return logoData;
  } catch (error) {
    return null; // fall back to default logo in UI
  }
}

export async function fetchMarketMovers(): Promise<MarketMoversResponse | null> {
  if (USE_MOCK_DATA) return mockMovers;

  const cacheKey = 'market_movers';
  const cached = await getCache<MarketMoversResponse>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(ALPHA_BASE_URL, {
      params: {
        function: 'TOP_GAINERS_LOSERS',
        apikey: ALPHA_API_KEY,
      },
    });

    const data: MarketMoversResponse = {
      top_gainers: response.data.top_gainers || [],
      top_losers: response.data.top_losers || [],
    };

    if (data.top_gainers.length === 0 && data.top_losers.length === 0) {
      throw new Error('Empty API response');
    }

    await setCache(cacheKey, data);
    return data;
  } catch (error) {

    return null; // Critical: return null so UI knows to show error
  }
}


export async function fetchStockOverview(symbol: string): Promise<any | null> {
  if (USE_MOCK_DATA) return mockOverviews[symbol];

  const cacheKey = `overview_${symbol}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(ALPHA_BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: ALPHA_API_KEY,
      },
    });

    await setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function fetchCurrentQuote(symbol: string): Promise<any | null> {
  if (USE_MOCK_DATA) return mockQuotes[symbol];

  const cacheKey = `quote_${symbol}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(ALPHA_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_API_KEY,
      },
    });

    const data = {
      symbol: response.data['Global Quote']['01. symbol'],
      price: response.data['Global Quote']['05. price'],
      change: response.data['Global Quote']['09. change'],
      change_percentage: response.data['Global Quote']['10. change percent'],
      volume: response.data['Global Quote']['06. volume'],
    };

    await setCache(cacheKey, data, 1 * 60 * 1000); // Cache for 1 minute
    return data;
  } catch (error) {
    return null;
  }
}

export async function fetchTimeSeries(
  symbol: string,
  interval: 'intraday' | 'daily' | 'weekly' | 'monthly'
): Promise<{ date: string; price: number }[] | null> {
  if (USE_MOCK_DATA) {
    const mockData = sharedMockTimeSeries?.[interval] || {};
    return Object.entries(mockData).map(([date, value]: any) => ({
      date,
      price: parseFloat(value['4. close']),
    }));
  }

  const cacheKey = `timeseries_${symbol}_${interval}`;
  const cached = await getCache<{ date: string; price: number }[]>(cacheKey);
  if (cached) return cached;

  const functionMap = {
    intraday: 'TIME_SERIES_INTRADAY',
    daily: 'TIME_SERIES_DAILY',
    weekly: 'TIME_SERIES_WEEKLY',
    monthly: 'TIME_SERIES_MONTHLY',
  };

  const intervalParam = interval === 'intraday' ? { interval: '60min' } : {};

  try {
    const response = await axios.get(ALPHA_BASE_URL, {
      params: {
        function: functionMap[interval],
        symbol,
        apikey: ALPHA_API_KEY,
        ...intervalParam,
      },
    });

    const dataKey = Object.keys(response.data).find((key) =>
      key.includes('Time Series')
    );

    if (!dataKey) return null;

    const timeSeries = response.data[dataKey];
    const parsed = Object.entries(timeSeries).slice(0, 6).map(([date, value]: any) => ({
      date,
      price: parseFloat(value['4. close']),
    }));

    await setCache(cacheKey, parsed);
    return parsed;
  } catch (error) {
    return null;
  }
}
