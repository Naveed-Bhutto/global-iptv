# Global IPTV Lite Web Application

A lightweight, standalone IPTV web application optimized for low-bandwidth environments (2G/3G) and unstable network conditions. Stream live TV channels from Pakistan, India, and around the world.

## Features

- 📺 **Live TV Streaming** - Support for HLS (m3u8) and MP4 streams
- 🎨 **Clean UI** - Mobile-first responsive design
- 🌐 **Category Navigation** - Pakistan, India, Sports, Entertainment, Global
- 📡 **Network Resilience** - Auto-reconnect on connection loss
- 🐢 **Low Bandwidth Mode** - Optimize for 2G/3G networks
- 💾 **Self-contained** - No database required, works offline after loading
- 📝 **Easy Maintenance** - Edit `channels.json` to manage channels

## Tech Stack

- Pure HTML5, CSS3, Vanilla JavaScript
- Plyr (Video Player)
- HLS.js (HLS Streaming)
- Font Awesome Icons
- No heavy frameworks - optimized for low-end devices

## Installation & Deployment

### Local Deployment

1. **Download and extract** the zip folder containing all files
2. **Navigate to the folder** and open `index.html` in any modern browser
3. **Or use a local server** (recommended for best experience):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server -p 8000
