import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import StockCard from '../../components/StockCard';
import { fetchMarketMovers } from '../../services/api';
import { Ticker } from '../../types/Ticker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchLogos } from '../../services/api';
import { useRouter } from 'expo-router';


const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2; // 16 padding + 8 gap + 8 gap

export default function ViewAllScreen() {
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();

  const [data, setData] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();


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
    async function loadData() {
      setLoading(true);
      const movers = await fetchMarketMovers();

      if (!movers) {
        setData([]);
        setLoading(false);
        return;
      }

      if (type === 'gainers') {
        const gainersWithLogos = await attachLogos(movers.top_gainers || []);
        setData(gainersWithLogos);
      } else if (type === 'losers') {
        const losersWithLogos = await attachLogos(movers.top_losers || []);
        setData(losersWithLogos);
      }

      setLoading(false);
    }

    loadData();
  }, [type]);

  const filteredResults = data.filter((stock) =>
    stock.ticker.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#000" />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
    <Text style={styles.title}>All Top {type}</Text>
  </View>

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


      {search ? (
        filteredResults.length === 0 ? (
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
        )
      ) : (
        <FlatList
          data={data}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, backgroundColor: '#fff', flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
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
  headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

});
