import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WatchlistProvider } from '@/services/WatchlistContext';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WatchlistProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="view-all/[type]" options={{ headerShown: false}} />
          <Stack.Screen name="stock/[symbol]" options={{ headerShown: false}} />
          <Stack.Screen name="watchlist/[id]" options={{ headerShown: false}} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </WatchlistProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
