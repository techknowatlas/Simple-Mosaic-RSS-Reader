import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MarketWatch, MarketQuote } from '../types';
import './MarketQuotesTile.css';

interface MarketQuotesTileProps {
  watch: MarketWatch;
}

export default function MarketQuotesTile({ watch }: MarketQuotesTileProps) {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    if (watch.symbols && watch.symbols.length > 0) {
      fetchQuotes();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!watch.symbols || watch.symbols.length === 0) return;
    
    const intervalMinutes = watch.refreshInterval || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    const intervalId = setInterval(() => {
      fetchQuotes();
    }, intervalMs);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch.refreshInterval]);

  const fetchQuotes = async () => {
    if (!watch.symbols || watch.symbols.length === 0) {
      setError('No symbols configured');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const marketQuotes = await invoke<MarketQuote[]>('fetch_market_quotes', { 
        symbols: watch.symbols
      });
      
      setQuotes(marketQuotes || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Failed to fetch market data');
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchQuotes();
  };

  if (loading && quotes.length === 0) {
    return (
      <div className="market-quotes-tile loading">
        <div className="tile-header">
          <h3>{watch.name}</h3>
        </div>
        <div className="tile-content">
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-quotes-tile error">
        <div className="tile-header">
          <h3>{watch.name}</h3>
          <button onClick={handleRefresh} className="btn-refresh">
            ↻
          </button>
        </div>
        <div className="tile-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-quotes-tile">
      <div className="tile-header">
        <h3>{watch.name}</h3>
        <button 
          onClick={handleRefresh} 
          className="btn-refresh"
          disabled={loading}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className="tile-content">
        {quotes.length === 0 ? (
          <p>No market data available</p>
        ) : (
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Cur.Price</th>
                <th>Prev.Close</th>
                <th>CHG</th>
                <th>CHG%</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => {
                const isPositive = quote.change >= 0;
                const changeClass = isPositive ? 'positive' : 'negative';
                const arrow = isPositive ? '▲' : '▼';
                
                return (
                  <tr key={quote.symbol}>
                    <td className="symbol">{quote.symbol}</td>
                    <td className="price">{quote.price.toFixed(2)}</td>
                    <td className="prev-close">{quote.prevClose.toFixed(2)}</td>
                    <td className={`change ${changeClass}`}>
                      {arrow} {Math.abs(quote.change).toFixed(2)}
                    </td>
                    <td className={`change-percent ${changeClass}`}>
                      {arrow} {Math.abs(quote.changePercent).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
