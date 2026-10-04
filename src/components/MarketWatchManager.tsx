import { useState } from 'react';
import { MarketWatch } from '../types';
import './FeedManager.css'; // Reuse FeedManager styles

interface MarketWatchManagerProps {
  watches: MarketWatch[];
  onAddWatch: (watch: MarketWatch) => void;
  onRemoveWatch: (watchId: string) => void;
  onClose: () => void;
}

const PRESET_WATCHES = [
  {
    name: 'Major Indices',
    symbols: ['^DJI', '^IXIC', '^GSPC', '^VIX']
  },
  {
    name: 'Commodities',
    symbols: ['GC=F', 'CL=F', 'NG=F', 'SI=F']
  },
  {
    name: 'Crypto',
    symbols: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD']
  },
  {
    name: 'Tech Giants',
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
  }
];

export default function MarketWatchManager({ watches, onAddWatch, onRemoveWatch, onClose }: MarketWatchManagerProps) {
  const [name, setName] = useState('');
  const [symbols, setSymbols] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !symbols.trim()) return;

    const symbolList = symbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (symbolList.length === 0) return;

    const newWatch: MarketWatch = {
      id: `watch-${Date.now()}`,
      name: name.trim(),
      symbols: symbolList,
      refreshInterval: 5 // 5 minutes
    };

    onAddWatch(newWatch);
    setName('');
    setSymbols('');
  };

  const handleQuickAdd = (preset: typeof PRESET_WATCHES[0]) => {
    const newWatch: MarketWatch = {
      id: `watch-${Date.now()}`,
      name: preset.name,
      symbols: preset.symbols,
      refreshInterval: 5
    };
    onAddWatch(newWatch);
  };

  return (
    <div className="feed-manager-overlay">
      <div className="feed-manager">
        <div className="feed-manager-header">
          <h2>Market Watch Manager</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="feed-manager-content">
          <form onSubmit={handleSubmit} className="feed-form">
            <div className="form-group">
              <label htmlFor="watch-name">Watch Name</label>
              <input
                id="watch-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Portfolio"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="watch-symbols">
                Symbols (comma-separated)
                <span className="form-help">e.g., AAPL,MSFT,^DJI</span>
              </label>
              <input
                id="watch-symbols"
                type="text"
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                placeholder="AAPL,MSFT,GOOGL"
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full">
              Add Market Watch
            </button>
          </form>

          <div className="quick-add">
            <h3>Quick Add Presets</h3>
            <div className="quick-add-buttons">
              {PRESET_WATCHES.map((preset, index) => (
                <button
                  key={index}
                  className="btn-secondary btn-small"
                  onClick={() => handleQuickAdd(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="feed-list">
            <h3>Current Watches</h3>
            {watches.length === 0 ? (
              <p className="empty-message">No market watches yet. Add one above!</p>
            ) : (
              <ul>
                {watches.map((watch) => (
                  <li key={watch.id} className="feed-item">
                    <div className="feed-info">
                      <strong>{watch.name}</strong>
                      <span className="feed-url">{watch.symbols.join(', ')}</span>
                    </div>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => onRemoveWatch(watch.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="symbol-guide">
            <h3>Symbol Format Guide</h3>
            <div className="guide-section">
              <strong>Indices:</strong> ^DJI, ^IXIC, ^GSPC, ^RUT, ^VIX
            </div>
            <div className="guide-section">
              <strong>Commodities:</strong> GC=F (Gold), CL=F (Oil), NG=F (Gas)
            </div>
            <div className="guide-section">
              <strong>Forex:</strong> EURUSD=X, GBPUSD=X
            </div>
            <div className="guide-section">
              <strong>Crypto:</strong> BTC-USD, ETH-USD, SOL-USD
            </div>
            <div className="guide-section">
              <strong>Stocks:</strong> Regular tickers (AAPL, MSFT, GOOGL)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
