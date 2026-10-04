// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::fs;
use tauri::Manager;
use yahoo_finance_api as yahoo;
use regex::Regex;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RSSItem {
    id: String,
    feed_id: String,
    title: String,
    link: String,
    description: Option<String>,
    content: Option<String>,
    author: Option<String>,
    pub_date: DateTime<Utc>,
    pub_date_raw: Option<String>, // Original date string from feed
    thumbnail: Option<String>,
    read: bool,
}

#[tauri::command]
async fn fetch_rss_feed(url: String, feed_id: String) -> Result<Vec<RSSItem>, String> {
    use std::time::Duration;
    
    // Create a client with a browser-like User-Agent and timeout
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    // Fetch the RSS/Atom feed
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;
    
    let content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read feed content: {}", e))?;

    // Try parsing as RSS first
    if let Ok(channel) = content.parse::<rss::Channel>() {
        let items: Vec<RSSItem> = channel
            .items()
            .iter()
            .map(|item| {
                let pub_date_raw = item.pub_date().map(|s| s.to_string());
                let pub_date = item
                    .pub_date()
                    .and_then(|d| {
                        // Try RFC2822 format first (most common in RSS)
                        DateTime::parse_from_rfc2822(d)
                            .ok()
                            // Try RFC3339/ISO8601 format as fallback
                            .or_else(|| DateTime::parse_from_rfc3339(d).ok())
                    })
                    .map(|d| d.with_timezone(&Utc))
                    .unwrap_or_else(|| Utc::now());

                // Try to extract thumbnail from enclosures or description
                let thumbnail = item
                    .enclosure()
                    .and_then(|e| {
                        let url = e.url().to_string();
                        if url.contains(".jpg") || url.contains(".png") || url.contains(".jpeg") {
                            Some(url)
                        } else {
                            None
                        }
                    });

                RSSItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    feed_id: feed_id.clone(),
                    title: item.title().unwrap_or("Untitled").to_string(),
                    link: item.link().unwrap_or("").to_string(),
                    description: item.description().map(|s| s.to_string()),
                    content: item.content().map(|s| s.to_string()),
                    author: item.author().map(|s| s.to_string()),
                    pub_date,
                    pub_date_raw,
                    thumbnail,
                    read: false,
                }
            })
            .collect();

        return Ok(items);
    }

    // Try parsing as Atom feed
    if let Ok(feed) = content.parse::<atom_syndication::Feed>() {
        let items: Vec<RSSItem> = feed
            .entries()
            .iter()
            .map(|entry| {
                let pub_date = entry.updated().with_timezone(&Utc);
                let pub_date_raw = Some(entry.updated().to_rfc3339());

                let thumbnail = entry.links().iter().find_map(|link| {
                    if link.mime_type().map_or(false, |m| m.starts_with("image/")) {
                        Some(link.href().to_string())
                    } else {
                        None
                    }
                });

                let description = entry
                    .summary()
                    .map(|s| s.to_string())
                    .or_else(|| entry.content().and_then(|c| c.value()).map(|s| s.to_string()));

                RSSItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    feed_id: feed_id.clone(),
                    title: entry.title().to_string(),
                    link: entry
                        .links()
                        .first()
                        .map(|l| l.href().to_string())
                        .unwrap_or_default(),
                    description: description.clone(),
                    content: entry.content().and_then(|c| c.value()).map(|s| s.to_string()),
                    author: entry
                        .authors()
                        .first()
                        .map(|a| a.name().to_string()),
                    pub_date,
                    pub_date_raw,
                    thumbnail,
                    read: false,
                }
            })
            .collect();

        return Ok(items);
    }

    Err("Unable to parse feed as RSS or Atom".to_string())
}

#[tauri::command]
async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    tauri_plugin_shell::ShellExt::shell(&app_handle)
        .open(url, None)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

#[tauri::command]
fn save_app_data(app_handle: tauri::AppHandle, data: String) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    let data_path = app_dir.join("app_data.json");
    fs::write(data_path, data)
        .map_err(|e| format!("Failed to write data: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn load_app_data(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let data_path = app_dir.join("app_data.json");
    
    if !data_path.exists() {
        return Ok(String::from("{\"feeds\":[],\"tiles\":[],\"watches\":[]}"));
    }
    
    fs::read_to_string(data_path)
        .map_err(|e| format!("Failed to read data: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MarketQuote {
    symbol: String,
    price: f64,
    change: f64,
    change_percent: f64,
    prev_close: f64,
}

// Signal Summary structs
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SignalItem {
    source: String,
    title: String,
    text: String,
    link: String,
    timestamp: DateTime<Utc>,
    tickers: Vec<String>,
    topics: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SignalTheme {
    rank: usize,
    title: String,
    sources: Vec<String>,
    reasoning: String,
    tickers: Vec<String>,
    relevance_score: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SignalSummary {
    date: DateTime<Utc>,
    themes: Vec<SignalTheme>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SignalHistory {
    summaries: Vec<SignalSummary>,
}

// Helper function to extract ticker symbols from text
fn extract_tickers(text: &str) -> Vec<String> {
    let ticker_regex = Regex::new(r"\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b").unwrap();
    let mut tickers = Vec::new();
    
    for cap in ticker_regex.captures_iter(text) {
        if let Some(ticker) = cap.get(1).or_else(|| cap.get(2)) {
            let t = ticker.as_str().to_string();
            // Filter out common words that look like tickers
            if !matches!(t.as_str(), "RSS" | "API" | "URL" | "HTTP" | "HTML" | "PDF" | "USD" | "USA") {
                if !tickers.contains(&t) {
                    tickers.push(t);
                }
            }
        }
    }
    
    tickers
}

#[tauri::command]
async fn aggregate_signal_data(app_handle: tauri::AppHandle, data_json: String) -> Result<String, String> {
    // Parse the app data to get feeds and market watches
    let app_data: serde_json::Value = serde_json::from_str(&data_json)
        .map_err(|e| format!("Failed to parse app data: {}", e))?;
    
    let mut signal_items = Vec::new();
    
    // Process RSS feeds
    if let Some(feeds) = app_data["feeds"].as_array() {
        for feed in feeds {
            let feed_url = feed["url"].as_str().unwrap_or("");
            let feed_title = feed["title"].as_str().unwrap_or("Unknown Feed");
            let feed_id = feed["id"].as_str().unwrap_or("");
            
            // Fetch RSS items for this feed
            if let Ok(items) = fetch_rss_feed(feed_url.to_string(), feed_id.to_string()).await {
                for item in items.iter().take(10) { // Limit to 10 most recent items per feed
                    let text = item.description.clone()
                        .or_else(|| item.content.clone())
                        .unwrap_or_default();
                    
                    let combined_text = format!("{} {}", item.title, text);
                    let tickers = extract_tickers(&combined_text);
                    
                    signal_items.push(SignalItem {
                        source: feed_title.to_string(),
                        title: item.title.clone(),
                        text: text.chars().take(500).collect(), // Limit text length
                        link: item.link.clone(),
                        timestamp: item.pub_date,
                        tickers,
                        topics: Vec::new(), // Will be populated by AI
                    });
                }
            }
        }
    }
    
    // Process market quotes
    if let Some(watches) = app_data["watches"].as_array() {
        for watch in watches {
            let watch_name = watch["name"].as_str().unwrap_or("Market Watch");
            if let Some(symbols_array) = watch["symbols"].as_array() {
                let symbols: Vec<String> = symbols_array
                    .iter()
                    .filter_map(|s| s.as_str().map(String::from))
                    .collect();
                
                if let Ok(quotes) = fetch_market_quotes(symbols).await {
                    for quote in quotes {
                        let text = format!(
                            "Price: ${:.2}, Change: {:.2}%, Prev Close: ${:.2}",
                            quote.price, quote.change_percent, quote.prev_close
                        );
                        
                        signal_items.push(SignalItem {
                            source: watch_name.to_string(),
                            title: format!("{} Market Data", quote.symbol),
                            text,
                            link: format!("https://finance.yahoo.com/quote/{}", quote.symbol),
                            timestamp: Utc::now(),
                            tickers: vec![quote.symbol.clone()],
                            topics: Vec::new(),
                        });
                    }
                }
            }
        }
    }
    
    // Return aggregated signal items as JSON
    serde_json::to_string(&signal_items)
        .map_err(|e| format!("Failed to serialize signal items: {}", e))
}

#[tauri::command]
async fn call_ai_analysis(signal_items_json: String, api_key: String) -> Result<String, String> {
    use std::time::Duration;
    
    let signal_items: Vec<SignalItem> = serde_json::from_str(&signal_items_json)
        .map_err(|e| format!("Failed to parse signal items: {}", e))?;
    
    if signal_items.is_empty() {
        return Err("No signal items to analyze".to_string());
    }
    
    // Prepare data summary for Claude
    let mut data_summary = String::new();
    data_summary.push_str("Recent feed items and market data:\n\n");
    
    for (idx, item) in signal_items.iter().enumerate().take(50) { // Limit to 50 items
        data_summary.push_str(&format!(
            "{}. [{}] {}\nSource: {}\nTickers: {}\nTime: {}\n\n",
            idx + 1,
            item.source,
            item.title,
            item.source,
            item.tickers.join(", "),
            item.timestamp.format("%Y-%m-%d %H:%M")
        ));
    }
    
    // Build Claude API request
    let system_prompt = "You are a financial signal analyst. Analyze the provided RSS feed items and market data to identify the top 5 recurring themes or signals. CRITICAL: You must respond with ONLY valid JSON, no markdown formatting, no explanation text, no code blocks. Return exactly this structure and nothing else.";
    
    let user_prompt = format!(
        "{}\n\nBased on this data, identify the top 5 recurring themes or signals. Return a JSON object with this structure:\n{{\n  \"themes\": [\n    {{\n      \"rank\": 1,\n      \"title\": \"Theme title\",\n      \"sources\": [\"Source1\", \"Source2\"],\n      \"reasoning\": \"Why this matters\",\n      \"tickers\": [\"TICKER1\", \"TICKER2\"],\n      \"relevanceScore\": 0.95\n    }}\n  ]\n}}",
        data_summary
    );
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let request_body = serde_json::json!({
        "model": "claude-sonnet-4-6",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": user_prompt
            }
        ]
    });
    
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to call Claude API: {}", e))?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Claude API error: {}", error_text));
    }
    
    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Claude response: {}", e))?;
    
    // Extract the text content from Claude's response
    let content_text = response_json["content"][0]["text"]
        .as_str()
        .ok_or("Failed to extract text from Claude response")?;
    
    // Claude sometimes wraps JSON in markdown code blocks, so let's clean it
    let cleaned_text = content_text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();
    
    // Parse the JSON from Claude's text response
    let themes_json: serde_json::Value = serde_json::from_str(cleaned_text)
        .map_err(|e| format!("Failed to parse themes JSON: {}. Raw response: {}", e, content_text))?;
    
    // Create SignalSummary
    let summary = SignalSummary {
        date: Utc::now(),
        themes: themes_json["themes"]
            .as_array()
            .ok_or("Invalid themes array")?
            .iter()
            .map(|t| SignalTheme {
                rank: t["rank"].as_u64().unwrap_or(0) as usize,
                title: t["title"].as_str().unwrap_or("").to_string(),
                sources: t["sources"]
                    .as_array()
                    .map(|arr| arr.iter().filter_map(|s| s.as_str().map(String::from)).collect())
                    .unwrap_or_default(),
                reasoning: t["reasoning"].as_str().unwrap_or("").to_string(),
                tickers: t["tickers"]
                    .as_array()
                    .map(|arr| arr.iter().filter_map(|s| s.as_str().map(String::from)).collect())
                    .unwrap_or_default(),
                relevance_score: t["relevanceScore"].as_f64().unwrap_or(0.0),
            })
            .collect(),
    };
    
    serde_json::to_string(&summary)
        .map_err(|e| format!("Failed to serialize summary: {}", e))
}

#[tauri::command]
fn save_signal_summary(app_handle: tauri::AppHandle, summary_json: String) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    let history_path = app_dir.join("signal_history.json");
    
    // Load existing history or create new
    let mut history = if history_path.exists() {
        let history_str = fs::read_to_string(&history_path)
            .map_err(|e| format!("Failed to read history: {}", e))?;
        serde_json::from_str::<SignalHistory>(&history_str)
            .unwrap_or_else(|_| SignalHistory { summaries: Vec::new() })
    } else {
        SignalHistory { summaries: Vec::new() }
    };
    
    // Parse new summary
    let new_summary: SignalSummary = serde_json::from_str(&summary_json)
        .map_err(|e| format!("Failed to parse summary: {}", e))?;
    
    // Add to history (keep last 30 days)
    history.summaries.push(new_summary);
    history.summaries.sort_by(|a, b| b.date.cmp(&a.date));
    history.summaries.truncate(30);
    
    // Save history
    let history_json = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;
    fs::write(history_path, history_json)
        .map_err(|e| format!("Failed to write history: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn load_signal_history(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let history_path = app_dir.join("signal_history.json");
    
    if !history_path.exists() {
        return Ok(String::from("{\"summaries\":[]}"));
    }
    
    fs::read_to_string(history_path)
        .map_err(|e| format!("Failed to read history: {}", e))
}

#[tauri::command]
async fn fetch_market_quotes(symbols: Vec<String>) -> Result<Vec<MarketQuote>, String> {
    use std::time::Duration;
    
    let provider = yahoo::YahooConnector::new()
        .map_err(|e| format!("Failed to create Yahoo connector: {}", e))?;
    
    let mut quotes = Vec::new();
    
    for symbol in symbols {
        // Add timeout to prevent hanging
        let fetch_result = tokio::time::timeout(
            Duration::from_secs(10),
            provider.get_latest_quotes(&symbol, "1d")
        ).await;
        
        match fetch_result {
            Ok(Ok(response)) => {
                if let Ok(quote) = response.last_quote() {
                    let change = quote.close - quote.open;
                    let change_percent = (change / quote.open) * 100.0;
                    
                    quotes.push(MarketQuote {
                        symbol: symbol.clone(),
                        price: quote.close,
                        change,
                        change_percent,
                        prev_close: quote.open,
                    });
                }
            }
            Ok(Err(e)) => {
                eprintln!("Failed to fetch quote for {}: {}", symbol, e);
            }
            Err(_) => {
                eprintln!("Timeout fetching quote for {}", symbol);
            }
        }
    }
    
    Ok(quotes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            fetch_rss_feed, 
            open_url, 
            save_app_data, 
            load_app_data,
            fetch_market_quotes,
            aggregate_signal_data,
            call_ai_analysis,
            save_signal_summary,
            load_signal_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
