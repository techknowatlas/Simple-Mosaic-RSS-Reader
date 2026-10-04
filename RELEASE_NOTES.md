# Mosaic RSS Reader - Release Notes

## Version 2.0.0 - Initial Release

**Release Date:** January 2026

### 🎉 Welcome to Mosaic RSS Reader!

Mosaic RSS Reader brings a fresh, customizable approach to staying informed. Organize your favorite news sources, blogs, and market data in a beautiful mosaic tile layout.

---

## ✨ Key Features

### RSS Feed Management
- **Multiple Feed Support** - Add unlimited RSS and Atom feeds from your favorite sources
- **Auto-Refresh** - Feeds automatically update to bring you the latest content
- **Clean Reading Experience** - Article titles, dates, and summaries displayed clearly
- **Direct Links** - Tap any article to open in your browser

### Market Data Tracking
- **Real-Time Quotes** - Track stocks, indices, commodities, and cryptocurrencies
- **Major Indices** - Pre-configured watchlists for S&P 500, Nasdaq, Dow Jones, and more
- **Custom Watchlists** - Create your own market tracking tiles
- **Price Changes** - See current prices and percentage changes at a glance

### Mosaic Tile Interface
- **Customizable Layout** - Arrange your content tiles however you like
- **Responsive Design** - Optimized for phone and tablet screens
- **Touch-Friendly** - Large, easy-to-tap buttons and tiles
- **Multiple Tile Types** - Mix RSS feeds and market data on one screen

### Personalization
- **Theme Customization** - Choose colors and styling that suit your taste
- **Flexible Refresh Intervals** - Control how often feeds update (5-60 minutes)
- **Persistent Storage** - Your feeds and layout are saved automatically

---

## 📱 What's New in This Release

### Mobile Experience
- Fully native Android app built with modern technology
- Smooth scrolling and touch interactions
- Optimized for all Android devices (Android 7.0+)

### Performance
- Fast feed fetching with 30-second timeout protection
- Efficient memory usage
- Local data caching for quick app startup

### Stability
- Error handling to prevent crashes
- Network timeout protection
- Isolated tile rendering (one tile error won't crash the app)

---

## 🚀 Getting Started

1. **Add Your First Feed**
   - Tap "Manage Feeds" button
   - Enter a feed name and RSS URL
   - Tap "Add Feed"

2. **Track Markets**
   - Tap "Market Watch" button
   - Choose a preset or enter custom symbols
   - Tap "Add Market Watch"

3. **Customize**
   - Tap "Theme" to change colors
   - Scroll through your tiles
   - Tap refresh icons to update individual feeds

---

## 📋 Popular RSS Feeds to Try

**News**
- New York Times: `https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml`
- The Guardian: `https://www.theguardian.com/world/rss`
- BBC News: `https://feeds.bbci.co.uk/news/world/rss.xml`

**Tech**
- TechCrunch: `https://techcrunch.com/feed/`
- The Verge: `https://www.theverge.com/rss/index.xml`
- Hacker News: `https://hnrss.org/frontpage`

**Finance**
- Yahoo Finance: `https://finance.yahoo.com/news/rssindex`
- MarketWatch: `https://www.marketwatch.com/rss/topstories`

---

## 🔧 Technical Details

**Technology Stack**
- Frontend: React with TypeScript
- Backend: Rust for RSS parsing and market data
- Framework: Tauri for native mobile performance

**Requirements**
- Android 7.0 (API 24) or higher
- Internet connection for fetching feeds and market data
- ~40MB storage space

**Permissions**
- Internet access (required for fetching RSS feeds and market data)
- Network state (to detect connectivity)

---

## 🐛 Known Issues

- Initial feed load may take a few seconds depending on feed size
- Some RSS feeds may not include images/thumbnails
- Market data updates require active internet connection

---

## 💡 Tips & Tricks

- **Pull down** to refresh all feeds at once
- **Tap refresh icons** on individual tiles to update just that feed
- **Long press** article titles to copy links (coming soon)
- **Check back often** - feeds auto-refresh based on your settings

---

## 📧 Feedback & Support

We'd love to hear from you!

- **Bug reports**: Report issues you encounter
- **Feature requests**: Tell us what you'd like to see
- **General feedback**: Let us know how we're doing

---

## 🙏 Thank You

Thank you for being an early tester of Mosaic RSS Reader! Your feedback helps us build a better app for everyone.

---

## 📅 Coming Soon

We're working on exciting new features:

- **Push notifications** for breaking news
- **Offline reading** mode
- **Article bookmarking** and read later lists
- **Share articles** directly from the app
- **Dark mode** for comfortable night reading
- **Widget support** for your home screen
- **Export/import** feed lists

Stay tuned for updates!

---

**Version:** 2.0.0  
**Build:** Universal Release  
**Platform:** Android 7.0+  
**Release Type:** Initial Public Release
