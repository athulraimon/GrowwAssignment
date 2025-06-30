import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import StockCard from '../../components/StockCard';
import { fetchMarketMovers, fetchLogos } from '../../services/api';
import { Ticker } from '../../types/Ticker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [isSearching, setIsSearching] = useState(false);
  const [gainers, setGainers] = useState<Ticker[]>([]);
  const [losers, setLosers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const combinedStocks = [...gainers, ...losers];
  const filteredResults = combinedStocks.filter((stock) =>
    stock.ticker.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const movers = await fetchMarketMovers();

        if (!movers || !movers.top_gainers || !movers.top_losers) {
          setError('Unable to fetch market data! Please try again later :(');
          setLoading(false);
          return;
        }

        const gainersWithLogos = await attachLogos(movers.top_gainers.slice(0, 4));
        const losersWithLogos = await attachLogos(movers.top_losers.slice(0, 4));

        setGainers(gainersWithLogos);
        setLosers(losersWithLogos);
      } catch (err) {
        console.error('Explore load error:', err);
        setError('An unexpected error occurred. Please try again later.');
      }

      setLoading(false);
    }

    async function attachLogos(tickers: Ticker[]): Promise<(Ticker & { logo?: string })[]> {
      return await Promise.all(
        tickers.map(async (stock) => {
          try {
            const logos = await fetchLogos(stock.ticker);
            return { ...stock, logo: logos?.[0]?.image || null };
          } catch {
            return stock;
          }
        })
      );
    }

    loadData();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>StockApp</Text>
        {isSearching ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Symbol"
              value={search}
              autoFocus
              onChangeText={setSearch}
              onBlur={() => {
                if (search === '') setIsSearching(false);
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsSearching(true)}>
            <Ionicons name="search" size={22} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : search ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Search Results</Text>
          {filteredResults.length === 0 ? (
            <Text style={{ marginTop: 10, color: '#888' }}>No stocks found</Text>
          ) : (
            <FlatList
              data={filteredResults}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ width: CARD_WIDTH }}
                  onPress={() => router.push(`/stock/${item.ticker}`)}
                >
                  <StockCard stock={item} />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => item.ticker + index}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Gainers</Text>
            <TouchableOpacity onPress={() => router.push('/view-all/gainers')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={gainers}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: CARD_WIDTH }}
                onPress={() => router.push(`/stock/${item.ticker}`)}
              >
                <StockCard stock={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => item.ticker + index}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Losers</Text>
            <TouchableOpacity onPress={() => router.push('/view-all/losers')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={losers}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: CARD_WIDTH }}
                onPress={() => router.push(`/stock/${item.ticker}`)}
              >
                <StockCard stock={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => item.ticker + index}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  viewAll: { color: 'black' },
  errorText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
