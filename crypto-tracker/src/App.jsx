import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Sun, Moon, BarChart3, Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// API Service
const coinGeckoAPI = {
  async fetchCoins() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );
      if (!response.ok) throw new Error('Failed to fetch coins');
      return await response.json();
    } catch (error) {
      console.error('Error fetching coins:', error);
      return [];
    }
  },

  async fetchVanryData() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/vanar-chain');
      if (!response.ok) throw new Error('Failed to fetch Vanry data');
      const data = await response.json();
      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        image: data.image?.large,
        current_price: data.market_data?.current_price?.usd,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h,
        market_cap: data.market_data?.market_cap?.usd
      };
    } catch (error) {
      console.error('Error fetching Vanry:', error);
      return null;
    }
  },

  async fetchChartData(coinId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
      );
      if (!response.ok) throw new Error('Failed to fetch chart data');
      const data = await response.json();
      
      return data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toLocaleDateString(),
        price: price,
        timestamp: timestamp
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  }
};

// Custom Hook
const useCoins = () => {
  const [coins, setCoins] = useState([]);
  const [vanryData, setVanryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [coinsData, vanry] = await Promise.all([
        coinGeckoAPI.fetchCoins(),
        coinGeckoAPI.fetchVanryData()
      ]);
      
      setCoins(coinsData);
      setVanryData(vanry);
      setLoading(false);
    };

    fetchData();
  }, []);

  return { coins, vanryData, loading };
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  const { isDark } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-4xl mx-4 p-6 rounded-lg max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

// Price Chart Component
const PriceChart = ({ data, coinName, isDark }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Loading chart data...
        </p>
      </div>
    );
  }

  return (
    <div className="px-25">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(value) => `$${value.toFixed(2)}`} />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000'
            }}
            formatter={(value) => [`$${value.toFixed(4)}`, 'Price']}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    
  );
};

// Coin Card Component
// Coin Card Component
// Coin Card Component
const CoinCard = ({ coin, onClick, isVanry = false }) => {
  const { isDark } = useTheme();
  const changeColor = coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border-b-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${isDark ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-500'}`}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = isDark ? '#1f2937' : '#ffffff';
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img src={coin.image} alt={coin.name} className="rounded-full flex-shrink-0" style={{width: '40px', height: '40px'}}/>
          <div className='flex items-baseline pl-8'>
            <h3 className={`font-semibold text-base ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{coin.name}</h3>
            <p className={`text-sm font-medium pl-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{coin.symbol?.toUpperCase()}</p>
          </div>
        </div>

        <div className="text-right">
          <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${coin.current_price?.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${changeColor}`}>
            {coin.price_change_percentage_24h >= 0 ? '+' : ''}
            {coin.price_change_percentage_24h?.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

// Search Filter Component
const SearchFilter = ({ searchTerm, setSearchTerm, filter, setFilter }) => {
  const { isDark } = useTheme();

  const filters = [
    { key: 'all', label: 'All', icon: null },
    { key: 'gainers', label: 'Gainers', icon: TrendingUp },
    { key: 'losers', label: 'Losers', icon: TrendingDown }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="Search cryptocurrencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        />
      </div>
      
      <div className="flex space-x-3">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${filter === key ? 'bg-blue-500 text-white shadow-lg transform scale-105' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'}`}
          >
            {Icon && <Icon size={16} />}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Coin Detail Component
const CoinDetail = ({ coin, onClose }) => {
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      const data = await coinGeckoAPI.fetchChartData(coin.id);
      setChartData(data);
      setLoading(false);
    };

    if (coin) fetchChart();
  }, [coin]);

  if (!coin) return null;

  const changeColor = coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Modal isOpen={!!coin} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <img src={coin.image} alt={coin.name} className="w-16 h-16 rounded-full" />
          <div>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {coin.name}
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {coin.symbol?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Current Price</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ${coin.current_price?.toLocaleString()}
            </p>
          </div>
          
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>24h Change</p>
            <p className={`text-2xl font-bold ${changeColor}`}>
              {coin.price_change_percentage_24h >= 0 ? '+' : ''}
              {coin.price_change_percentage_24h?.toFixed(2)}%
            </p>
          </div>
          
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Market Cap</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ${coin.market_cap?.toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            7-Day Price Chart
          </h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <PriceChart data={chartData} coinName={coin.name} isDark={isDark} />
          )}
        </div>
      </div>
    </Modal>
  );
};

// Main App Component
const CryptocurrencyTracker = () => {
  const { isDark, toggleTheme } = useTheme();
  const { coins, vanryData, loading } = useCoins();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCoin, setSelectedCoin] = useState(null);

  const filteredAndSortedCoins = useMemo(() => {
    let filtered = coins.filter(coin =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (filter) {
      case 'gainers':
        filtered = filtered.filter(coin => coin.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        break;
      case 'losers':
        filtered = filtered.filter(coin => coin.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
        break;
    }

    if (vanryData) {
      const vanryMatchesSearch = vanryData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vanryData.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const vanryMatchesFilter = filter === 'all' || 
        (filter === 'gainers' && vanryData.price_change_percentage_24h > 0) ||
        (filter === 'losers' && vanryData.price_change_percentage_24h < 0);

      if (vanryMatchesSearch && vanryMatchesFilter) {
        filtered = filtered.filter(coin => coin.id !== 'vanar-chain');
        return [vanryData, ...filtered];
      }
    }

    return filtered;
  }, [coins, vanryData, searchTerm, filter]);

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading cryptocurrency data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <BarChart3 className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Crypto Tracker
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-lg border border-gray-200'}`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <SearchFilter 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filter={filter}
          setFilter={setFilter}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedCoins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onClick={() => setSelectedCoin(coin)}
              isVanry={coin.id === 'vanar-chain'}
            />
          ))}
        </div>

        {filteredAndSortedCoins.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <BarChart3 className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No Results Found
              </p>
              <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        )}

        <CoinDetail 
          coin={selectedCoin} 
          onClose={() => setSelectedCoin(null)} 
        />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <CryptocurrencyTracker />
    </ThemeProvider>
  );
};

export default App;