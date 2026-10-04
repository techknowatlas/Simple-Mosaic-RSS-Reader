import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RSSFeed, RSSItem, MosaicTile as MosaicTileType } from '../types';
import './MosaicTile.css';

interface MosaicTileProps {
  tile: MosaicTileType;
  feed: RSSFeed;
}

export default function MosaicTile({ tile, feed }: MosaicTileProps) {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch when feed URL changes
  useEffect(() => {
    fetchFeedItems();
  }, [feed.url]);

  // Auto-refresh based on feed's refresh interval (defaults to 30 minutes)
  useEffect(() => {
    const intervalMinutes = feed.refreshInterval || 30;
    const intervalMs = intervalMinutes * 60 * 1000;

    const intervalId = setInterval(() => {
      fetchFeedItems();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [feed.url, feed.refreshInterval]);

  const fetchFeedItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call Tauri backend to fetch RSS feed
      const feedItems = await invoke<RSSItem[]>('fetch_rss_feed', { 
        url: feed.url,
        feedId: feed.id 
      });
      
      setItems(feedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: RSSItem) => {
    // Open link in external browser
    await invoke('open_url', { url: item.link });
  };

  const handleRefresh = () => {
    fetchFeedItems();
  };

  if (loading && items.length === 0) {
    return (
      <div className="mosaic-tile loading">
        <div className="tile-header">
          <h3>{feed.title}</h3>
        </div>
        <div className="tile-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mosaic-tile error">
        <div className="tile-header">
          <h3>{feed.title}</h3>
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
    <div 
      className={`mosaic-tile ${tile.displayMode}`}
      style={{
        ...(tile.style.backgroundColor && { backgroundColor: tile.style.backgroundColor }),
        ...(tile.style.textColor && { color: tile.style.textColor }),
        ...(tile.style.borderColor && { borderColor: tile.style.borderColor }),
      }}
    >
      <div className="tile-header">
        <h3>{feed.title}</h3>
        <button 
          onClick={handleRefresh} 
          className="btn-refresh"
          disabled={loading}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className="tile-content">
        {items.length === 0 ? (
          <p>No items</p>
        ) : (
          <ul className="item-list">
            {items.slice(0, tile.layout.h === 1 ? 3 : 10).map(item => (
              <li 
                key={item.id} 
                className={`item ${item.read ? 'read' : 'unread'}`}
                onClick={() => handleItemClick(item)}
              >
                {tile.displayMode === 'image-focus' && item.thumbnail && (
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="item-thumbnail"
                  />
                )}
                <div className="item-content">
                  <h4 className="item-title">{item.title}</h4>
                  {tile.displayMode === 'detailed' && item.description && (
                    <p className="item-description">
                      {item.description.substring(0, 150)}...
                    </p>
                  )}
                  <span className="item-date">
                    {(() => {
                      try {
                        const date = new Date(item.pubDate);
                        if (isNaN(date.getTime())) {
                          // If parsing fails, show the raw date from the feed
                          return item.pubDateRaw || 'Date unavailable';
                        }
                        return date.toLocaleDateString();
                      } catch {
                        // If parsing fails, show the raw date from the feed
                        return item.pubDateRaw || 'Date unavailable';
                      }
                    })()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}