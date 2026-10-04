export interface RSSFeed {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  lastUpdated?: Date;
  refreshInterval?: number; // in minutes
}

export interface RSSItem {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate: string; // ISO 8601 date string from Rust DateTime<Utc>
  pubDateRaw?: string; // Original date string from the feed
  thumbnail?: string;
  read: boolean;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
}

export interface MarketWatch {
  id: string;
  name: string;
  symbols: string[];
  refreshInterval?: number; // in minutes
}

export interface MosaicTile {
  id: string;
  feedId?: string;
  watchId?: string;
  type: 'rss' | 'market';
  layout: TileLayout;
  style: TileStyle;
  displayMode: 'compact' | 'detailed' | 'image-focus';
}

export interface TileLayout {
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
}

export interface TileStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  gridColumns: number;
  defaultRefreshInterval: number;
  enableNotifications: boolean;
  openLinksInBrowser: boolean;
}

export interface SignalItem {
  source: string;
  title: string;
  text: string;
  link: string;
  timestamp: string;
  tickers: string[];
  topics: string[];
}

export interface SignalTheme {
  rank: number;
  title: string;
  sources: string[];
  reasoning: string;
  tickers: string[];
  relevanceScore: number;
}

export interface SignalSummary {
  date: string;
  themes: SignalTheme[];
}

export interface SignalHistory {
  summaries: SignalSummary[];
}
