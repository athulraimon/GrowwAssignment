import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'API_CACHE_';
const DEFAULT_TTL = 30 * 60 * 1000; // 5 minutes

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export async function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttl,
  };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const entryRaw = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!entryRaw) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(entryRaw);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key); // Expired
      return null;
    }
    return entry.value;
  } catch {
    await AsyncStorage.removeItem(CACHE_PREFIX + key); // Corrupted
    return null;
  }
}
