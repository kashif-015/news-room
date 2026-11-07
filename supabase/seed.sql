-- NewsDesk: Seed data
-- ~15 starter RSS feeds for Indian and global news

INSERT INTO sources (name, type, url, category, active) VALUES
-- Indian General News
('NDTV Top Stories', 'rss', 'https://feeds.feedburner.com/ndtvnews-top-stories', 'general', true),
('NDTV India', 'rss', 'https://feeds.feedburner.com/ndtvnews-india-news', 'politics', true),
('The Hindu', 'rss', 'https://www.thehindu.com/news/feeder/default.rss', 'general', true),
('Indian Express', 'rss', 'https://indianexpress.com/feed/', 'general', true),
('Times of India', 'rss', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'general', true),

-- Indian Business
('NDTV Business', 'rss', 'https://feeds.feedburner.com/ndtvprofit-latest', 'business', true),
('Mint', 'rss', 'https://www.livemint.com/rss/news', 'business', true),

-- World News
('Reuters World', 'rss', 'https://feeds.reuters.com/Reuters/worldNews', 'world', true),
('BBC World', 'rss', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', true),
('Al Jazeera', 'rss', 'https://www.aljazeera.com/xml/rss/all.xml', 'world', true),

-- Tech
('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 'tech', true),
('The Verge', 'rss', 'https://www.theverge.com/rss/index.xml', 'tech', true),

-- Sports
('ESPN Cricinfo', 'rss', 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', 'sports', true),

-- Entertainment
('NDTV Movies', 'rss', 'https://feeds.feedburner.com/ndtvmovies-latest', 'entertainment', true),

-- Indian Politics
('The Wire', 'rss', 'https://thewire.in/feed', 'politics', true);
