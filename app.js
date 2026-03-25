// Global IPTV Application
// Optimized for low bandwidth environments with auto-reconnect

// Application State
let currentPlayer = null;
let currentChannel = null;
let lowBandwidthMode = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let hlsInstance = null;
let isManualStop = false;
let channelsData = [];
let categoriesSet = new Set();
let activeCategory = "Pakistan";

// DOM Elements
const categoryListEl = document.getElementById('categoryList');
const channelsGridEl = document.getElementById('channelsGrid');
const bandwidthToggleBtn = document.getElementById('bandwidthToggle');
const streamStatusSpan = document.getElementById('streamStatus');
const statusIcon = streamStatusSpan?.previousElementSibling?.querySelector('i');
const currentCategoryTitleSpan = document.getElementById('currentCategoryTitle');
const lowBwIndicator = document.getElementById('lowBwIndicator');
const menuToggle = document.getElementById('menuToggleBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggleIcon = document.getElementById('toggleIcon');

// Sample Channel Database (Free-to-Air streams)
const DEFAULT_CHANNELS = [
    // Pakistani Channels
    { name: "PTV Sports", logo: "https://img.icons8.com/color/48/cricket.png", streamUrl: "https://cdn.pctvnetwork.com/live/ptvsports/playlist.m3u8", category: "Pakistan" },
    { name: "PTV Home", logo: "https://img.icons8.com/color/48/home.png", streamUrl: "https://cdn.pctvnetwork.com/live/ptvhome/playlist.m3u8", category: "Pakistan" },
    { name: "GEO News", logo: "https://img.icons8.com/color/48/news.png", streamUrl: "https://live.geo.tv/live/geonews/geonews.m3u8", category: "Pakistan" },
    { name: "ARY News", logo: "https://img.icons8.com/color/48/tv-show.png", streamUrl: "https://live.arynews.tv/live/arynews/index.m3u8", category: "Pakistan" },
    { name: "Hum TV", logo: "https://img.icons8.com/color/48/tv--v1.png", streamUrl: "https://humtv-live.akamaized.net/hls/live/2036332/humtv/master.m3u8", category: "Pakistan" },
    { name: "Express News", logo: "https://img.icons8.com/color/48/news--v1.png", streamUrl: "https://expressnews-live.akamaized.net/hls/live/express.m3u8", category: "Pakistan" },
    { name: "Dunya News", logo: "https://img.icons8.com/color/48/globe--v1.png", streamUrl: "https://dunyanews.tv/live/livestream.m3u8", category: "Pakistan" },
    
    // Indian Channels
    { name: "Star Plus", logo: "https://img.icons8.com/color/48/star.png", streamUrl: "https://starpluslive.akamaized.net/hls/live/starplus.m3u8", category: "India" },
    { name: "Zee TV", logo: "https://img.icons8.com/color/48/z.png", streamUrl: "https://zeetv.akamaized.net/hls/live/zeetv.m3u8", category: "India" },
    { name: "Sony TV", logo: "https://img.icons8.com/color/48/sony.png", streamUrl: "https://sonylive.akamaized.net/hls/live/setindia.m3u8", category: "India" },
    { name: "Colors TV", logo: "https://img.icons8.com/color/48/color-wheel.png", streamUrl: "https://colorstv.akamaized.net/hls/live/colors.m3u8", category: "India" },
    { name: "NDTV 24x7", logo: "https://img.icons8.com/color/48/ndtv.png", streamUrl: "https://ndtv24x7.akamaized.net/hls/live/ndtv24x7.m3u8", category: "India" },
    { name: "Times Now", logo: "https://img.icons8.com/color/48/times.png", streamUrl: "https://timesnow.akamaized.net/hls/live/timesnow.m3u8", category: "India" },
    
    // Sports
    { name: "ESPN", logo: "https://img.icons8.com/color/48/espn.png", streamUrl: "https://espn-espn-1.samsung.wurl.com/manifest/live.m3u8", category: "Sports" },
    { name: "Sky Sports", logo: "https://img.icons8.com/color/48/sky-news.png", streamUrl: "https://skysports-live.akamaized.net/hls/live/skysports.m3u8", category: "Sports" },
    { name: "Willow TV", logo: "https://img.icons8.com/color/48/cricket.png", streamUrl: "https://willowtv.akamaized.net/hls/live/willow.m3u8", category: "Sports" },
    
    // Global/Entertainment
    { name: "BBC World News", logo: "https://img.icons8.com/color/48/bbc.png", streamUrl: "https://bbcwsen.akamaized.net/hls/live/bbcworld.m3u8", category: "Global" },
    { name: "CNN International", logo: "https://img.icons8.com/color/48/cnn.png", streamUrl: "https://cnn-cnninternational-1.samsung.wurl.com/manifest/live.m3u8", category: "Global" },
    { name: "Al Jazeera", logo: "https://img.icons8.com/color/48/al-jazeera.png", streamUrl: "https://live-hls-web-aje.getaj.net/AJE/01.m3u8", category: "Global" },
    { name: "Sky News", logo: "https://img.icons8.com/color/48/sky-news.png", streamUrl: "https://skymedia-uk.akamaized.net/hls/live/skynews.m3u8", category: "Global" },
    { name: "DW News", logo: "https://img.icons8.com/color/48/germany.png", streamUrl: "https://dwstream3-lh.akamaihd.net/i/dwstream3_live@124409/index_1_av-p.m3u8", category: "Global" },
    
    // Entertainment
    { name: "MTV", logo: "https://img.icons8.com/color/48/mtv.png", streamUrl: "https://mtv-live.akamaized.net/hls/live/mtv.m3u8", category: "Entertainment" },
    { name: "VH1", logo: "https://img.icons8.com/color/48/musical-notes.png", streamUrl: "https://vh1-live.akamaized.net/hls/live/vh1.m3u8", category: "Entertainment" }
];

// Load channels from JSON or use defaults
async function loadChannels() {
    try {
        const response = await fetch('channels.json');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                channelsData = data;
                console.log('Loaded channels from channels.json');
                return;
            }
        }
        throw new Error('Using default channels');
    } catch (e) {
        channelsData = DEFAULT_CHANNELS;
        console.log('Using default channel list');
    }
    buildCategories();
    renderUI();
}

// Build categories from channel data
function buildCategories() {
    categoriesSet.clear();
    channelsData.forEach(ch => {
        if (ch.category) categoriesSet.add(ch.category);
    });
    
    // Ensure essential categories exist
    const essentialCategories = ["Pakistan", "India", "Sports", "Entertainment", "Global"];
    essentialCategories.forEach(cat => {
        if (!categoriesSet.has(cat)) categoriesSet.add(cat);
    });
    
    // Sort categories in logical order
    const ordered = ["Pakistan", "India", "Sports", "Entertainment", "Global", "News"];
    const sorted = Array.from(categoriesSet).sort((a, b) => {
        const indexA = ordered.indexOf(a);
        const indexB = ordered.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    renderCategories(sorted);
}

// Render category sidebar
function renderCategories(categories) {
    categoryListEl.innerHTML = '';
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = `category-item ${activeCategory === cat ? 'active' : ''}`;
        
        // Icon mapping
        let icon = 'fa-tv';
        switch(cat) {
            case 'Pakistan': icon = 'fa-flag-checkered'; break;
            case 'India': icon = 'fa-flag-checkered'; break;
            case 'Sports': icon = 'fa-futbol'; break;
            case 'Entertainment': icon = 'fa-film'; break;
            case 'Global': icon = 'fa-globe-americas'; break;
            case 'News': icon = 'fa-newspaper'; break;
        }
        
        div.innerHTML = `<i class="fas ${icon}"></i><span>${cat}</span>`;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            setActiveCategory(cat);
            if (window.innerWidth <= 768) closeSidebar();
        });
        categoryListEl.appendChild(div);
    });
}

// Set active category and refresh channel grid
function setActiveCategory(category) {
    activeCategory = category;
    if (currentCategoryTitleSpan) currentCategoryTitleSpan.innerText = category;
    
    // Update active class
    document.querySelectorAll('.category-item').forEach(el => {
        el.classList.remove('active');
        if (el.querySelector('span')?.innerText === category) {
            el.classList.add('active');
        }
    });
    
    renderChannelGrid();
}

// Render channel grid for current category
function renderChannelGrid() {
    if (!channelsGridEl) return;
    
    const filtered = channelsData.filter(ch => ch.category === activeCategory);
    
    if (filtered.length === 0) {
        channelsGridEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: #9ca3af;"><i class="fas fa-tv"></i><br>No channels in this category</div>';
        return;
    }
    
    channelsGridEl.innerHTML = '';
    filtered.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        
        const logoHtml = ch.logo ? 
            `<div class="channel-logo"><img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/48?text=TV'; this.onerror=null;"></div>` :
            `<div class="channel-logo"><i class="fas fa-tower-broadcast"></i></div>`;
        
        card.innerHTML = `
            ${logoHtml}
            <div class="channel-info">
                <div class="channel-name">${escapeHtml(ch.name)}</div>
                <div class="channel-category">${ch.category}</div>
            </div>
        `;
        
        card.addEventListener('click', () => playChannel(ch));
        channelsGridEl.appendChild(card);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Play selected channel with HLS.js support
function playChannel(channel) {
    if (!channel || !channel.streamUrl) {
        updateStatus('Invalid stream URL', false);
        return;
    }
    
    isManualStop = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    
    // Destroy existing HLS instance
    if (hlsInstance) {
        try {
            hlsInstance.destroy();
        } catch(e) {}
        hlsInstance = null;
    }
    
    currentChannel = channel;
    updateStatus(`Loading: ${channel.name}`, true);
    
    const videoElement = document.querySelector('#player');
    const url = channel.streamUrl;
    
    const handleError = (err) => {
        if (isManualStop) return;
        console.error('Stream error:', err);
        updateStatus(`Connection lost - retrying...`, false);
        attemptReconnect(channel);
    };
    
    // Handle HLS streams
    if (url.includes('.m3u8') || url.includes('m3u8')) {
        if (Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: !lowBandwidthMode,
                maxBufferLength: lowBandwidthMode ? 30 : 60,
                maxMaxBufferLength: lowBandwidthMode ? 60 : 120,
                startLevel: lowBandwidthMode ? 0 : -1,
                abrEwmaDefaultEstimate: lowBandwidthMode ? 1e5 : 5e5,
                autoStartLoad: true,
                debug: false
            });
            
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(videoElement);
            
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                if (lowBandwidthMode && hlsInstance.levels && hlsInstance.levels.length > 0) {
                    hlsInstance.currentLevel = 0;
                }
                videoElement.play().catch(e => console.log('Autoplay blocked:', e));
                updateStatus(`Playing: ${channel.name}`, true);
                reconnectAttempts = 0;
            });
            
            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            handleError(data);
                            break;
                        default:
                            hlsInstance.destroy();
                            attemptReconnect(channel);
                            break;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => console.log('Autoplay blocked'));
                updateStatus(`Playing: ${channel.name}`, true);
                reconnectAttempts = 0;
            });
            videoElement.addEventListener('error', () => handleError(new Error('Native HLS error')));
        } else {
            updateStatus('HLS not supported in this browser', false);
        }
    } else {
        // MP4 or direct stream
        videoElement.src = url;
        videoElement.addEventListener('canplay', () => {
            videoElement.play().catch(e => console.log('Autoplay blocked'));
            updateStatus(`Playing: ${channel.name}`, true);
            reconnectAttempts = 0;
        });
        videoElement.addEventListener('error', () => handleError(new Error('Stream error')));
    }
}

// Auto-reconnect logic for unstable networks
function attemptReconnect(channel) {
    if (isManualStop || !channel) return;
    
    if (reconnectAttempts >= 5) {
        updateStatus(`Failed to connect after 5 attempts. Please select another channel.`, false);
        reconnectAttempts = 0;
        return;
    }
    
    reconnectAttempts++;
    const delay = Math.min(3000 * reconnectAttempts, 15000);
    updateStatus(`Reconnecting in ${delay/1000}s... (${reconnectAttempts}/5)`, false);
    
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        if (!isManualStop && currentChannel) {
            playChannel(currentChannel);
        }
    }, delay);
}

// Update status display
function updateStatus(message, isOnline) {
    if (streamStatusSpan) {
        streamStatusSpan.innerHTML = message;
        const statusCircle = streamStatusSpan.previousElementSibling;
        if (statusCircle && statusCircle.classList) {
            statusCircle.className = `fas fa-circle ${isOnline ? 'status-online' : 'status-offline'}`;
        }
    }
}

// Toggle low bandwidth mode
function setLowBandwidthMode(enabled) {
    lowBandwidthMode = enabled;
    const toggle = document.getElementById('bandwidthToggle');
    
    if (enabled) {
        toggle?.classList.add('active');
        if (toggleIcon) toggleIcon.className = 'fas fa-toggle-on';
        if (lowBwIndicator) lowBwIndicator.style.display = 'block';
    } else {
        toggle?.classList.remove('active');
        if (toggleIcon) toggleIcon.className = 'fas fa-toggle-off';
        if (lowBwIndicator) lowBwIndicator.style.display = 'none';
    }
    
    // Restart current stream with new settings
    if (currentChannel && !isManualStop) {
        playChannel(currentChannel);
    }
}

// Sidebar controls for mobile
function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
}

function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
}

// Initialize Plyr player
function initPlayer() {
    const videoElement = document.querySelector('#player');
    if (videoElement) {
        currentPlayer = new Plyr(videoElement, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
            autoplay: false,
            muted: false,
            invertTime: false,
            seekTime: 10
        });
        
        videoElement.addEventListener('playing', () => {
            if (currentChannel) {
                updateStatus(`Playing: ${currentChannel.name}`, true);
            }
        });
        
        videoElement.addEventListener('waiting', () => {
            updateStatus('Buffering...', false);
        });
        
        videoElement.addEventListener('stalled', () => {
            if (!isManualStop && currentChannel) {
                updateStatus('Buffering (weak network)...', false);
            }
        });
    }
}

// Initialize event listeners
function initEventListeners() {
    if (bandwidthToggleBtn) {
        bandwidthToggleBtn.addEventListener('click', () => {
            setLowBandwidthMode(!lowBandwidthMode);
        });
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', openSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar on window resize if screen becomes larger
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar?.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// Render UI after data is loaded
function renderUI() {
    renderChannelGrid();
}

// Bootstrap the application
async function bootstrap() {
    await loadChannels();
    initPlayer();
    initEventListeners();
    
    // Auto-play first channel
    const firstChannel = channelsData.find(ch => ch.category === activeCategory);
    if (firstChannel) {
        setTimeout(() => playChannel(firstChannel), 500);
    }
    
    console.log('IPTV App initialized - Optimized for low bandwidth');
}

// Start the app
bootstrap();
