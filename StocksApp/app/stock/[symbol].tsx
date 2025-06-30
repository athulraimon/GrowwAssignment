
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Animated
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchStockOverview, fetchCurrentQuote, fetchTimeSeries, fetchLogos } from '../../services/api';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWatchlist } from '@/services/WatchlistContext';
import { useRouter } from 'expo-router';


export default function StockDetailScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const { symbol } = useLocalSearchParams();
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const { watchlists, addWatchlist, addStockToWatchlist, removeStockFromAllWatchlists } = useWatchlist();
  const [newListName, setNewListName] = useState('');
  const isBookmarked = watchlists.some(list => list.stocks.includes(symbol as string));
  const [selectedInterval, setSelectedInterval] = useState<'intraday' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [timeSeriesData, setTimeSeriesData] = useState<{ date: string; price: number }[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [overviewData, quoteData] = await Promise.all([
          fetchStockOverview(symbol as string),
          fetchCurrentQuote(symbol as string),
        ]);

        setStockInfo(overviewData);
        setQuote(quoteData);

        try {
          const logos = await fetchLogos(symbol as string);
          setLogoUrl(logos?.[0]?.image || null);
        } catch {
          setLogoUrl(null);
        }

        const series = await fetchTimeSeries(symbol as string, selectedInterval);
        setTimeSeriesData(series ?? []);
      } catch (err) {
        console.error('Stock detail load error:', err);
        setError('Failed to load stock data. Please try again later.');
      }

      setLoading(false);
    }

    loadData();
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      const data = await fetchTimeSeries(symbol as string, selectedInterval);
      setTimeSeriesData(data ?? []);
    };

    fetchData();
  }, [selectedInterval, symbol]);

  function calculatePosition() {
    const current = parseFloat(quote.price);
    const low = parseFloat(stockInfo['52WeekLow']);
    const high = parseFloat(stockInfo['52WeekHigh']);
    if (isNaN(current) || isNaN(low) || isNaN(high) || high === low) return 0;
    return ((current - low) / (high - low)) * 100;
  }

  function triggerToast(message: string) {
    setToastMessage(message);
    setShowToast(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowToast(false));
      }, 1500);
    });
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  if (error) return <View style={[styles.container, { paddingTop: insets.top + 16 }]}><Text style={{ textAlign: 'center', color: 'red', marginTop: 40 }}>{error}</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]}>

        {/* Stock Info Section */}
        <View style={styles.header}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Image source={{ uri: logoUrl || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg' }} style={styles.logo} resizeMode="contain" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.name}>{stockInfo.Name}</Text>
              <Text style={styles.meta}>{stockInfo.Symbol} • {stockInfo.AssetType}</Text>
              <Text style={styles.meta}>{stockInfo.Exchange}</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => {
                if (isBookmarked) {
                  const removedFrom = watchlists.filter(wl => wl.stocks.includes(symbol as string)).map(wl => wl.name);
                  removeStockFromAllWatchlists(symbol as string);
                  if (removedFrom.length > 0) triggerToast(`Removed from ${removedFrom.join(', ')}`);
                } else {
                  setModalVisible(true);
                }
              }}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color="#007aff"
                style={{ marginBottom: 8 }}
              />
            </TouchableOpacity>
            <Text style={styles.price}>${quote.price || 'N/A'}</Text>
            <Text style={[styles.change, { color: parseFloat(quote.change || '0') >= 0 ? 'green' : 'red' }]}>
              {quote.change} ({quote.change_percentage})
            </Text>
          </View>
        </View>

        {/* Time Series Chart */}
        <View>
          <View style={styles.tabContainer}>
            {['intraday', 'daily', 'weekly', 'monthly'].map((interval) => (
              <TouchableOpacity
                key={interval}
                onPress={() => setSelectedInterval(interval as any)}
                style={[styles.tabItem, selectedInterval === interval && styles.tabItemSelected]}
              >
                <Text style={[styles.tabText, selectedInterval === interval && styles.tabTextSelected]}>
                  {interval.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <LineChart
            data={{
              labels: timeSeriesData.map((d) => d.date.slice(5)).reverse(),
              datasets: [{ data: timeSeriesData.map((d) => d.price).reverse() }],
            }}
            width={Dimensions.get('window').width - 32}
            height={220}
            yAxisSuffix="$"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: () => `#007bff`,
            }}
            bezier
            style={{ marginVertical: 12, borderRadius: 8 }}
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionLabel}>About</Text>
        <Text style={styles.description}>{stockInfo.Description}</Text>
        <View style={styles.tagsContainer}><Text style={styles.tag}>{stockInfo.Industry}</Text></View>
        <View style={styles.tagsContainer}><Text style={styles.tag}>{stockInfo.Sector}</Text></View>

        {/* 52 Week Range */}
        <View style={{ marginTop: 16 }}>
          <View style={styles.rangeLabelRow}>
            <Text style={styles.rangeLabel}>52 Week Low</Text>
            <Text style={styles.rangeLabel}>52 Week High</Text>
          </View>
          <View style={styles.rangeContainer}>
            <Text style={{ fontSize: 12 }}>{stockInfo['52WeekLow']}</Text>
            <View style={styles.rangeBarWrapper}>
              <View style={styles.rangeBar} />
              <View style={[styles.arrowWrapper, { left: `${calculatePosition()}%` }]}>
                <Text style={styles.arrowLabel}>Current Price {quote.price}</Text>
                <View style={styles.arrow} />
              </View>
            </View>
            <Text style={{ fontSize: 12 }}>{stockInfo['52WeekHigh']}</Text>
          </View>
        </View>

        {/* Financial Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}><Text style={styles.metricLabel}>Market Cap</Text><Text>{stockInfo.Currency}{stockInfo.MarketCapitalization}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>P/E</Text><Text>{stockInfo.PERatio}</Text></View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metric}><Text style={styles.metricLabel}>Beta</Text><Text>{stockInfo.Beta}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Dividend Yield</Text><Text>{stockInfo.DividendYield}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Profit Margin</Text><Text>{stockInfo.ProfitMargin}</Text></View>
        </View>
      </ScrollView>

      {/* Add to Watchlist Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Watchlist</Text>
            {watchlists.map((wl) => (
              <TouchableOpacity
                key={wl.id}
                onPress={() => {
                  addStockToWatchlist(wl.id, symbol as string);
                  setModalVisible(false);
                  triggerToast(`Added to ${wl.name}`);
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text style={styles.modalItem}>{wl.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <TextInput placeholder="New watchlist" value={newListName} onChangeText={setNewListName} style={styles.modalInput} />
              <TouchableOpacity
                onPress={() => {
                  if (newListName.trim()) {
                    addWatchlist(newListName.trim());
                    setNewListName('');
                  }
                }}
              >
                <Text style={styles.modalCreate}>Create</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Toast */}
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'grey',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
  container: { padding: 16, backgroundColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold' },
  meta: { color: '#666', fontSize: 12 },
  price: { fontSize: 20, fontWeight: 'bold' },
  change: { color: 'green' },
  sectionLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  description: { marginVertical: 8, fontSize: 14, lineHeight: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagsContainer: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tag: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12 },
  rangeContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  rangeBar: { flex: 1, height: 8, backgroundColor: '#ddd', marginHorizontal: 8, borderRadius: 4 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metric: { alignItems: 'flex-start', flex: 1 },
  metricLabel: { fontSize: 12, color: '#888' },
  rangeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  rangeBarWrapper: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  arrowWrapper: {
    position: 'absolute',
    alignItems: 'center',
    top: -20,
    transform: [{ translateX: -6 }],
  },

  arrow: {
    position: 'absolute',
    top: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8, 
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#007bff', 
    transform: [{ translateX: -5 }],
  },

  arrowLabel: {
    fontSize: 10,
    color: '#007bff',
    marginBottom: 2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  modalItem: {
    fontSize: 16,
    paddingVertical: 6,
  },

  modalInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },

  modalCreate: {
    fontSize: 16,
    color: '#007aff',
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#ff3b30',
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabItemSelected: {
    backgroundColor: '#007aff',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 12,
    color: '#333',
  },
  tabTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
});
