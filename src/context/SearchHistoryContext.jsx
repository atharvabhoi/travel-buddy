import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

const SearchHistoryContext = createContext({});

export const useSearchHistory = () => {
  return useContext(SearchHistoryContext);
};

export const SearchHistoryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchSearchHistory();
    } else {
      // Load from localStorage for non-authenticated users
      const localHistory = localStorage.getItem('searchHistory');
      if (localHistory) {
        try {
          setSearchHistory(JSON.parse(localHistory));
        } catch (e) {
          console.error('Error parsing search history:', e);
        }
      }
    }
  }, [currentUser]);

  const fetchSearchHistory = async () => {
    if (!currentUser) return;

    try {
      const historyRef = collection(db, 'searchHistory');
      const q = query(
        historyRef,
        where('userId', '==', currentUser.uid),
        orderBy('searchedAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSearchHistory(history);
    } catch (error) {
      console.error('Error fetching search history:', error);
      // Fallback to localStorage
      const localHistory = localStorage.getItem('searchHistory');
      if (localHistory) {
        try {
          setSearchHistory(JSON.parse(localHistory));
        } catch (e) {
          console.error('Error parsing search history:', e);
        }
      }
    }
  };

  const addToSearchHistory = async (from, to, date) => {
    const searchEntry = {
      from,
      to,
      date,
      searchedAt: new Date().toISOString()
    };

    if (currentUser) {
      try {
        await addDoc(collection(db, 'searchHistory'), {
          ...searchEntry,
          userId: currentUser.uid
        });
        await fetchSearchHistory();
      } catch (error) {
        console.error('Error saving search history:', error);
        // Fallback to localStorage
        saveToLocalStorage(searchEntry);
      }
    } else {
      saveToLocalStorage(searchEntry);
    }
  };

  const saveToLocalStorage = (searchEntry) => {
    try {
      const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      // Remove duplicates
      const filtered = localHistory.filter(
        item => !(item.from === searchEntry.from && item.to === searchEntry.to && item.date === searchEntry.date)
      );
      // Add new entry at the beginning
      const updated = [searchEntry, ...filtered].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  const clearSearchHistory = async () => {
    if (currentUser) {
      // Note: Firestore doesn't support bulk delete easily, 
      // so we'll just clear the local state and localStorage
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
    } else {
      localStorage.removeItem('searchHistory');
      setSearchHistory([]);
    }
  };

  const value = {
    searchHistory,
    addToSearchHistory,
    clearSearchHistory
  };

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
};

