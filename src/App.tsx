import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import TileGrid from './components/TileGrid';
import FeedManager from './components/FeedManager';
import MarketWatchManager from './components/MarketWatchManager';
import ThemeSettings from './components/ThemeSettings';
import SignalSummary from './components/SignalSummary';
import { RSSFeed, MosaicTile, MarketWatch } from './types';
import './App.css';

interface AppData {
  feeds: RSSFeed[];
  tiles: MosaicTile[];
  watches: MarketWatch[];
}

function App() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [watches, setWatches] = useState<MarketWatch[]>([]);
  const [tiles, setTiles] = useState<MosaicTile[]>([]);
  const [showFeedManager, setShowFeedManager] = useState(false);
  const [showMarketManager, setShowMarketManager] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showSignalSummary, setShowSignalSummary] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const dataString = await invoke<string>('load_app_data');
        const data: AppData = JSON.parse(dataString);
        setFeeds(data.feeds || []);
        setWatches(data.watches || []);
        setTiles(data.tiles || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data whenever feeds or tiles change
  useEffect(() => {
    if (!isLoaded) return; // Don't save on initial load
    
    const saveData = async () => {
      try {
        const data: AppData = { feeds, watches, tiles };
        await invoke('save_app_data', { data: JSON.stringify(data) });
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    };
    saveData();
  }, [feeds, watches, tiles, isLoaded]);

  const handleAddFeed = (feed: RSSFeed) => {
    setFeeds([...feeds, feed]);
    
    // Create a tile for the new feed
    const newTile: MosaicTile = {
      id: `tile-${Date.now()}`,
      type: 'rss',
      feedId: feed.id,
      layout: { x: 0, y: 0, w: 2, h: 2 },
      style: {},
      displayMode: 'compact',
    };
    setTiles([...tiles, newTile]);
  };

  const handleRemoveFeed = (feedId: string) => {
    setFeeds(feeds.filter(f => f.id !== feedId));
    setTiles(tiles.filter(t => t.feedId !== feedId));
  };

  const handleAddWatch = (watch: MarketWatch) => {
    setWatches([...watches, watch]);
    
    // Create a tile for the new watch
    const newTile: MosaicTile = {
      id: `tile-${Date.now()}`,
      type: 'market',
      watchId: watch.id,
      layout: { x: 0, y: 0, w: 3, h: 2 },
      style: {},
      displayMode: 'compact',
    };
    setTiles([...tiles, newTile]);
  };

  const handleRemoveWatch = (watchId: string) => {
    setWatches(watches.filter(w => w.id !== watchId));
    setTiles(tiles.filter(t => t.watchId !== watchId));
  };

  const handleUpdateTiles = (updatedTiles: MosaicTile[]) => {
    setTiles(updatedTiles);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mosaic RSS Reader</h1>
        <div className="header-buttons">
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setShowThemeSettings(prev => !prev);
            }}
          >
            🎨 Theme
          </button>
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setShowFeedManager(prev => !prev);
            }}
          >
            {showFeedManager ? 'Close' : 'Manage Feeds'}
          </button>
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setShowMarketManager(prev => !prev);
            }}
          >
            📈 Market Watch
          </button>
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              setShowSignalSummary(prev => !prev);
            }}
          >
            📊 Signal Summary
          </button>
        </div>
      </header>

      {showThemeSettings && (
        <ThemeSettings onClose={() => setShowThemeSettings(false)} />
      )}

      {showFeedManager && (
        <FeedManager
          feeds={feeds}
          onAddFeed={handleAddFeed}
          onRemoveFeed={handleRemoveFeed}
          onClose={() => setShowFeedManager(false)}
        />
      )}

      {showMarketManager && (
        <MarketWatchManager
          watches={watches}
          onAddWatch={handleAddWatch}
          onRemoveWatch={handleRemoveWatch}
          onClose={() => setShowMarketManager(false)}
        />
      )}

      {showSignalSummary && (
        <SignalSummary
          feeds={feeds}
          watches={watches}
          tiles={tiles}
          onClose={() => setShowSignalSummary(false)}
        />
      )}

      <main className="app-main">
        {tiles.length === 0 ? (
          <div className="empty-state">
            <h2>No feeds yet</h2>
            <p>Click "Manage Feeds" to add your first RSS feed</p>
          </div>
        ) : (
          <TileGrid 
            tiles={tiles} 
            feeds={feeds}
            watches={watches}
            onUpdateTiles={handleUpdateTiles}
          />
        )}
      </main>
    </div>
  );
}

export default App;