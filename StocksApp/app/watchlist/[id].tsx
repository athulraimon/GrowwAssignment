// app/watchlist/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWatchlist } from '@/services/WatchlistContext';
import { fetchMarketMovers } from '@/services/api';
import StockCard from '@/components/StockCard';
import { Ticker } from '@/types/Ticker';
import { fetchLogos } from '@/services/api';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Add at the top


const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2; // 16 padding + 8 gap + 8 gap

export default function WatchlistDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { watchlists } = useWatchlist();
  const [loading, setLoading] = useState(true);
  const [matchingStocks, setMatchingStocks] = useState<Ticker[]>([]);

  const watchlist = watchlists.find(w => w.id === id);

  async function attachLogos(tickers: Ticker[]): Promise<(Ticker & { logo?: string })[]> {
    return await Promise.all(
        tickers.map(async (stock) => {
        try {
            const logos = await fetchLogos(stock.ticker);
            return { ...stock, logo: logos?.[0]?.image || null };
        } catch {
            return { ...stock };
        }
        })
    );
    }


  useEffect(() => {
  async function loadMatchingStocks() {
    if (!watchlist) return;

    setLoading(true);
    const movers = await fetchMarketMovers();

    if (!movers) {
      setMatchingStocks([]);
      setLoading(false);
      return;
    }

    const { top_gainers = [], top_losers = [] } = movers;
    const allMovers = [...top_gainers, ...top_losers];
    const filtered = allMovers.filter(mover =>
      watchlist.stocks.includes(mover.ticker)
    );
    const stocksWithLogos = await attachLogos(filtered);
    setMatchingStocks(stocksWithLogos);
    setLoading(false);
  }

  loadMatchingStocks();
}, [id]);


  if (!watchlist) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Watchlist not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>{watchlist.name}</Text>
        </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" />
      ) : matchingStocks.length === 0 ? (
        <Text style={styles.empty}>No stocks added yet.</Text>
      ) : (
        <FlatList
          data={matchingStocks}
          keyExtractor={(item) => item.ticker}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: CARD_WIDTH }}
              onPress={() => router.push(`/stock/${item.ticker}`)}
            >
              <StockCard stock={item} />
            </TouchableOpacity>
          )}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold' },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 32 },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
},


});
