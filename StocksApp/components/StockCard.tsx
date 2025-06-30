// src/components/StockCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ticker } from '../types/Ticker';

const DEFAULT_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

export default function StockCard({ stock }: { stock: Ticker & { logo?: string } }) {
  const isPositive = parseFloat(stock.change_amount) >= 0;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: stock.logo || DEFAULT_LOGO }}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.symbol}>{stock.ticker}</Text>
      <Text>${stock.price}</Text>
      <Text style={{ color: isPositive ? 'green' : 'red' }}>
        {stock.change_amount} ({stock.change_percentage})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    margin: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
});
