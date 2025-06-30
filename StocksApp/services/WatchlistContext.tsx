import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Watchlist = {
  id: string;
  name: string;
  stocks: string[];
};

type ContextType = {
  watchlists: Watchlist[];
  addWatchlist: (name: string) => void;
  addStockToWatchlist: (listId: string, ticker: string) => void;
  removeStockFromAllWatchlists: (ticker: string) => void;
  renameWatchlist: (id: string, newName: string) => void;
  deleteWatchlist: (id: string) => void;
};

const WatchlistContext = createContext<ContextType | null>(null);

export const useWatchlist = () => useContext(WatchlistContext)!;

export const WatchlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  // Load from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('watchlists').then((data) => {
      if (data) setWatchlists(JSON.parse(data));
    });
  }, []);

  // Save to AsyncStorage on every change
  useEffect(() => {
    AsyncStorage.setItem('watchlists', JSON.stringify(watchlists));
  }, [watchlists]);

  const addWatchlist = (name: string) => {
    setWatchlists(prev => [...prev, { id: Date.now().toString(), name, stocks: [] }]);
  };

  const addStockToWatchlist = (listId: string, ticker: string) => {
    setWatchlists(prev =>
      prev.map(w =>
        w.id === listId && !w.stocks.includes(ticker)
          ? { ...w, stocks: [...w.stocks, ticker] }
          : w
      )
    );
  };

  const removeStockFromAllWatchlists = (ticker: string) => {
    setWatchlists(prev =>
      prev.map(w => ({
        ...w,
        stocks: w.stocks.filter(s => s !== ticker),
      }))
    );
  };

  const renameWatchlist = (id: string, newName: string) => {
    setWatchlists(prev =>
      prev.map(w => (w.id === id ? { ...w, name: newName } : w))
    );
  };

  const deleteWatchlist = (id: string) => {
    setWatchlists(prev => prev.filter(w => w.id !== id));
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        addWatchlist,
        addStockToWatchlist,
        removeStockFromAllWatchlists,
        renameWatchlist,
        deleteWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};
