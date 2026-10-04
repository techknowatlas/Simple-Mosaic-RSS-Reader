import { useState } from 'react';
import { RSSFeed } from '../types';
import './FeedManager.css';

interface FeedManagerProps {
  feeds: RSSFeed[];
  onAddFeed: (feed: RSSFeed) => void;
  onRemoveFeed: (feedId: string) => void;
  onClose: () => void;
}

export default function FeedManager({ 
  feeds, 
  onAddFeed, 
  onRemoveFeed, 
  onClose 
}: FeedManagerProps) {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedTitle, setFeedTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedUrl.trim()) {
      setError('Please enter a feed URL');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // Validate URL format
      new URL(feedUrl);

      const newFeed: RSSFeed = {
        id: `feed-${Date.now()}`,
        title: feedTitle.trim() || feedUrl,
        url: feedUrl.trim(),
        refreshInterval: 30, // 30 minutes default
      };

      onAddFeed(newFeed);
      setFeedUrl('');
      setFeedTitle('');
    } catch (err) {
      setError('Invalid URL format');
    } finally {
      setIsAdding(false);
    }
  };

  const popularFeeds = [
    { title: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
    { title: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  ];

  const handleQuickAdd = (feed: { title: string; url: string }) => {
    setFeedTitle(feed.title);
    setFeedUrl(feed.url);
  };

  return (
    <div className="feed-manager-overlay" onClick={onClose}>
      <div className="feed-manager" onClick={(e) => e.stopPropagation()}>
        <div className="feed-manager-header">
          <h2>Manage Feeds</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="feed-manager-content">
          <section className="add-feed-section">
            <h3>Add New Feed</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="feed-title">Title (optional)</label>
                <input
                  id="feed-title"
                  type="text"
                  value={feedTitle}
                  onChange={(e) => setFeedTitle(e.target.value)}
                  placeholder="My Favorite Blog"
                  disabled={isAdding}
                />
              </div>

              <div className="form-group">
                <label htmlFor="feed-url">RSS Feed URL *</label>
                <input
                  id="feed-url"
                  type="text"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  disabled={isAdding}
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Feed'}
              </button>
            </form>

            <div className="popular-feeds">
              <h4>Quick Add</h4>
              <div className="quick-add-buttons">
                {popularFeeds.map((feed) => (
                  <button
                    key={feed.url}
                    className="btn-secondary btn-small"
                    onClick={() => handleQuickAdd(feed)}
                  >
                    {feed.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="feeds-list-section">
            <h3>Your Feeds ({feeds.length})</h3>
            {feeds.length === 0 ? (
              <p className="empty-message">No feeds added yet</p>
            ) : (
              <ul className="feeds-list">
                {feeds.map((feed) => (
                  <li key={feed.id} className="feed-item">
                    <div className="feed-info">
                      <h4>{feed.title}</h4>
                      <p className="feed-url">{feed.url}</p>
                    </div>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => onRemoveFeed(feed.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}