import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SignalSummary as SignalSummaryType, SignalTheme } from '../types';
import './SignalSummary.css';

interface SignalSummaryProps {
  onClose: () => void;
  feeds: any[];
  watches: any[];
  tiles: any[];
}

export default function SignalSummary({ onClose, feeds, watches, tiles }: SignalSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SignalSummaryType | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set([1]));
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    // Check if API key is in localStorage
    const savedApiKey = localStorage.getItem('anthropic_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    // Always show API key input initially so users know they need to provide one
    setShowApiKeyInput(true);
  }, []);

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Please provide your Claude API key');
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save API key to localStorage
      localStorage.setItem('anthropic_api_key', apiKey);

      // Aggregate signal data
      const appData = { feeds, watches, tiles };
      const signalItemsJson = await invoke<string>('aggregate_signal_data', {
        appHandle: null,
        dataJson: JSON.stringify(appData),
      });

      // Call AI analysis
      const summaryJson = await invoke<string>('call_ai_analysis', {
        signalItemsJson,
        apiKey,
      });

      const summaryData: SignalSummaryType = JSON.parse(summaryJson);
      setSummary(summaryData);

      // Save summary to history
      await invoke('save_signal_summary', {
        appHandle: null,
        summaryJson,
      });

      // Expand first theme by default
      setExpandedThemes(new Set([1]));
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = (rank: number) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedThemes(newExpanded);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#fbbf24'; // Gold
    return '#64748b'; // Gray
  };

  return (
    <div className="signal-summary-overlay" onClick={onClose}>
      <div className="signal-summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="signal-summary-header">
          <h2>📊 Signal Summary</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="signal-summary-content">
          {!summary && (
            <div className="api-key-section">
              <p className="api-key-info">
                To use Signal Summary, you need a Claude API key from Anthropic.
                <br />
                <a href="https://platform.claude.com/docs/en/api/overview#getting-api-keys" target="_blank" rel="noopener noreferrer">
                  Learn how to get your API key →
                </a>
              </p>
              <div className="api-key-input-group">
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="api-key-input"
                />
                <button
                  className="btn-secondary"
                  onClick={() => {
                    localStorage.removeItem('anthropic_api_key');
                    setApiKey('');
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {!summary && !loading && (
            <div className="empty-state">
              <p>Generate an AI-powered analysis of your feeds and market data.</p>
              <p className="empty-state-subtitle">
                Identifies top 5 recurring themes and signals across all your tiles.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Analyzing your feeds and market data...</p>
              <p className="loading-subtitle">This may take 10-20 seconds</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button className="btn-primary" onClick={handleAnalyze}>
                Try Again
              </button>
            </div>
          )}

          {summary && !loading && (
            <div className="themes-list">
              <div className="summary-date">
                Analysis from {new Date(summary.date).toLocaleString()}
              </div>

              {summary.themes.map((theme: SignalTheme) => (
                <div key={theme.rank} className="theme-card">
                  <div
                    className="theme-header"
                    onClick={() => toggleTheme(theme.rank)}
                  >
                    <div className="theme-rank">#{theme.rank}</div>
                    <div className="theme-title-section">
                      <h3 className="theme-title">{theme.title}</h3>
                      <div className="theme-meta">
                        <span className="theme-sources">
                          {theme.sources.length} source{theme.sources.length !== 1 ? 's' : ''}
                        </span>
                        {theme.tickers.length > 0 && (
                          <span className="theme-tickers">
                            {theme.tickers.map(t => `$${t}`).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="relevance-indicator"
                      style={{ backgroundColor: getRelevanceColor(theme.relevanceScore) }}
                      title={`Relevance: ${(theme.relevanceScore * 100).toFixed(0)}%`}
                    >
                      {(theme.relevanceScore * 100).toFixed(0)}%
                    </div>
                    <div className={`expand-icon ${expandedThemes.has(theme.rank) ? 'expanded' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {expandedThemes.has(theme.rank) && (
                    <div className="theme-details">
                      <div className="theme-reasoning">
                        <strong>Why it matters:</strong>
                        <p>{theme.reasoning}</p>
                      </div>
                      <div className="theme-sources-list">
                        <strong>Sources:</strong>
                        <ul>
                          {theme.sources.map((source, idx) => (
                            <li key={idx}>{source}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="signal-summary-footer">
          {!loading && (
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!apiKey}
            >
              {summary ? '🔄 Refresh Analysis' : '🚀 Generate Signal Summary'}
            </button>
          )}
          {summary && (
            <button
              className="btn-secondary"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              {showApiKeyInput ? 'Hide' : 'API'} Key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
