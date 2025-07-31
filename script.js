// ==================== CONSTANTS AND CONFIGURATION ====================
const CONFIG = {
    // API Configuration
    hianime: {
        baseURL: 'https://hianime.to/api',
        endpoints: {
            search: '/anime/search',
            trending: '/anime/trending',
            top: '/anime/top-airing',
            info: '/anime/info',
            episode: '/anime/episode',
            servers: '/anime/servers',
            random: '/anime/random'
        }
    },
    
    // Backup API (Jikan API for MAL data)
    backup: {
        baseURL: 'https://api.jikan.moe/v4',
        endpoints: {
            search: '/anime',
            top: '/top/anime',
            seasons: '/seasons',
            random: '/random/anime'
        }
    },
    
    // Local Storage Keys
    storage: {
        userProgress: 'otakutrack_progress',
        userSettings: 'otakutrack_settings',
        cache: 'otakutrack_cache'
    },
    
    // Notification Types
    notifications: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    // Debounce Delays
    debounce: {
        search: 300,
        progress: 500
    }
};

// ==================== UTILITY FUNCTIONS ====================
class Utils {
    static debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }
    
    static formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }
    
    static sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
    
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    static calculateProgress(current, total) {
        if (!total || total === 0) return 0;
        return Math.min(Math.round((current / total) * 100), 100);
    }
    
    static estimateWatchTime(episodes, episodeLength = 24) {
        return Math.round((episodes * episodeLength) / 60 * 10) / 10; // Hours with 1 decimal
    }
    
    static truncateText(text, length = 100) {
        return text.length > length ? text.slice(0, length) + '...' : text;
    }
    
    static getStatusColor(status) {
        const colors = {
            'watching': '#3b82f6',
            'completed': '#10b981',
            'on_hold': '#f59e0b',
            'dropped': '#ef4444',
            'plan_to_watch': '#8b5cf6'
        };
        return colors[status] || '#6b7280';
    }
    
    static getStatusLabel(status) {
        const labels = {
            'watching': 'Watching',
            'completed': 'Completed',
            'on_hold': 'On Hold',
            'dropped': 'Dropped',
            'plan_to_watch': 'Plan to Watch'
        };
        return labels[status] || status;
    }
}

// ==================== API SERVICE ====================
class APIService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    async request(url, options = {}) {
        // Check cache first
        const cacheKey = url + JSON.stringify(options);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    async searchAnime(query, page = 1) {
        try {
            // Try hianime.to API first (note: this is a placeholder URL as the actual API might not exist)
            // In a real implementation, you would use the actual API endpoints
            
            // For now, we'll use the Jikan API as it's publicly available
            const url = `${CONFIG.backup.baseURL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&sfw=true`;
            const response = await this.request(url);
            
            return {
                data: response.data.map(anime => ({
                    id: anime.mal_id,
                    title: anime.title,
                    titleEnglish: anime.title_english,
                    titleJapanese: anime.title_japanese,
                    image: anime.images.jpg.large_image_url,
                    score: anime.score,
                    episodes: anime.episodes,
                    status: anime.status,
                    synopsis: anime.synopsis,
                    genres: anime.genres.map(g => g.name),
                    year: anime.year,
                    season: anime.season,
                    studios: anime.studios?.map(s => s.name) || [],
                    duration: anime.duration,
                    rating: anime.rating,
                    type: anime.type,
                    aired: anime.aired
                })),
                pagination: response.pagination
            };
        } catch (error) {
            console.error('Search anime failed:', error);
            return this.getFallbackSearchData(query);
        }
    }
    
    async getTrendingAnime(period = 'now') {
        try {
            // Map periods to Jikan API parameters
            const periodMap = {
                'today': 'now',
                'week': 'now',
                'month': 'now'
            };
            
            const url = `${CONFIG.backup.baseURL}/top/anime?filter=airing&limit=20`;
            const response = await this.request(url);
            
            return response.data.map(anime => ({
                id: anime.mal_id,
                title: anime.title,
                image: anime.images.jpg.large_image_url,
                score: anime.score,
                episodes: anime.episodes,
                synopsis: Utils.truncateText(anime.synopsis, 150),
                genres: anime.genres.slice(0, 3).map(g => g.name),
                rank: anime.rank,
                popularity: anime.popularity
            }));
        } catch (error) {
            console.error('Get trending anime failed:', error);
            return this.getFallbackTrendingData();
        }
    }
    
    async getAnimeDetails(id) {
        try {
            const url = `${CONFIG.backup.baseURL}/anime/${id}/full`;
            const response = await this.request(url);
            const anime = response.data;
            
            return {
                id: anime.mal_id,
                title: anime.title,
                titleEnglish: anime.title_english,
                titleJapanese: anime.title_japanese,
                image: anime.images.jpg.large_image_url,
                trailer: anime.trailer?.youtube_id,
                score: anime.score,
                episodes: anime.episodes,
                status: anime.status,
                synopsis: anime.synopsis,
                genres: anime.genres.map(g => g.name),
                year: anime.year,
                season: anime.season,
                studios: anime.studios.map(s => s.name),
                duration: anime.duration,
                rating: anime.rating,
                type: anime.type,
                aired: anime.aired,
                popularity: anime.popularity,
                rank: anime.rank,
                members: anime.members,
                favorites: anime.favorites
            };
        } catch (error) {
            console.error('Get anime details failed:', error);
            return null;
        }
    }
    
    async getRandomAnime() {
        try {
            const url = `${CONFIG.backup.baseURL}/random/anime`;
            const response = await this.request(url);
            const anime = response.data;
            
            return {
                id: anime.mal_id,
                title: anime.title,
                image: anime.images.jpg.large_image_url,
                score: anime.score,
                episodes: anime.episodes,
                synopsis: Utils.truncateText(anime.synopsis, 150),
                genres: anime.genres.slice(0, 3).map(g => g.name)
            };
        } catch (error) {
            console.error('Get random anime failed:', error);
            return this.getFallbackRandomData();
        }
    }
    
    // Fallback data for when API is unavailable
    getFallbackSearchData(query) {
        const fallbackData = [
            {
                id: 'jujutsu-kaisen',
                title: 'Jujutsu Kaisen',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
                score: 8.8,
                episodes: 24,
                synopsis: 'A high school student gains control of an extremely powerful cursed spirit and gets enrolled in the Tokyo Prefectural Jujutsu High School.',
                genres: ['Action', 'Fantasy', 'Supernatural']
            },
            {
                id: 'demon-slayer',
                title: 'Demon Slayer',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTc93blC.jpg',
                score: 8.7,
                episodes: 26,
                synopsis: 'A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly.',
                genres: ['Action', 'Historical', 'Supernatural']
            }
        ].filter(anime => anime.title.toLowerCase().includes(query.toLowerCase()));
        
        return { data: fallbackData, pagination: { has_next_page: false } };
    }
    
    getFallbackTrendingData() {
        return [
            {
                id: 'spy-family',
                title: 'Spy x Family',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx138006-9q2ZzZzZzZzZ.jpg',
                score: 8.9,
                episodes: 12,
                synopsis: 'A spy must create a fake family to execute a mission, not realizing his wife is an assassin and his daughter is a telepath.',
                genres: ['Action', 'Comedy', 'Family'],
                rank: 1,
                popularity: 1
            },
            {
                id: 'chainsaw-man',
                title: 'Chainsaw Man',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-9q2ZzZzZzZzZ.jpg',
                score: 8.6,
                episodes: 12,
                synopsis: 'Denji is a young man trapped in poverty, working off his deceased father\'s debt to the yakuza by working as a Devil Hunter.',
                genres: ['Action', 'Horror', 'Supernatural'],
                rank: 2,
                popularity: 2
            }
        ];
    }
    
    getFallbackRandomData() {
        const randomAnime = [
            {
                id: 'attack-on-titan',
                title: 'Attack on Titan',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-8Y8wXbIBWYlQ.jpg',
                score: 8.9,
                episodes: 87,
                synopsis: 'Humanity fights for survival against giant humanoid Titans behind enormous walls.',
                genres: ['Action', 'Drama', 'Fantasy']
            },
            {
                id: 'one-piece',
                title: 'One Piece',
                image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCNHwbMZg9rF.jpg',
                score: 8.8,
                episodes: 1000,
                synopsis: 'Monkey D. Luffy explores the Grand Line to find the legendary treasure known as the "One Piece".',
                genres: ['Action', 'Adventure', 'Comedy']
            }
        ];
        
        return randomAnime[Math.floor(Math.random() * randomAnime.length)];
    }
}

// ==================== PROGRESS TRACKER ====================
class ProgressTracker {
    constructor() {
        this.storage = localStorage;
        this.progress = this.loadProgress();
        this.listeners = new Set();
    }
    
    loadProgress() {
        try {
            const data = this.storage.getItem(CONFIG.storage.userProgress);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load progress:', error);
            return {};
        }
    }
    
    saveProgress() {
        try {
            this.storage.setItem(CONFIG.storage.userProgress, JSON.stringify(this.progress));
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }
    
    addAnime(id, data) {
        this.progress[id] = {
            ...data,
            addedAt: Date.now(),
            updatedAt: Date.now()
        };
        return this.saveProgress();
    }
    
    updateAnime(id, data) {
        if (this.progress[id]) {
            this.progress[id] = {
                ...this.progress[id],
                ...data,
                updatedAt: Date.now()
            };
            return this.saveProgress();
        }
        return false;
    }
    
    removeAnime(id) {
        if (this.progress[id]) {
            delete this.progress[id];
            return this.saveProgress();
        }
        return false;
    }
    
    getAnime(id) {
        return this.progress[id] || null;
    }
    
    getAllAnime() {
        return this.progress;
    }
    
    getAnimeByStatus(status) {
        return Object.entries(this.progress)
            .filter(([_, data]) => data.status === status)
            .reduce((acc, [id, data]) => ({ ...acc, [id]: data }), {});
    }
    
    getStats() {
        const allAnime = Object.values(this.progress);
        const stats = {
            total: allAnime.length,
            watching: 0,
            completed: 0,
            onHold: 0,
            dropped: 0,
            planToWatch: 0,
            totalEpisodes: 0,
            totalHours: 0,
            averageScore: 0
        };
        
        let totalRatings = 0;
        let totalScore = 0;
        
        allAnime.forEach(anime => {
            switch (anime.status) {
                case 'watching': stats.watching++; break;
                case 'completed': stats.completed++; break;
                case 'on_hold': stats.onHold++; break;
                case 'dropped': stats.dropped++; break;
                case 'plan_to_watch': stats.planToWatch++; break;
            }
            
            stats.totalEpisodes += anime.currentEpisode || 0;
            stats.totalHours += Utils.estimateWatchTime(anime.currentEpisode || 0);
            
            if (anime.rating) {
                totalScore += parseInt(anime.rating);
                totalRatings++;
            }
        });
        
        stats.averageScore = totalRatings > 0 ? (totalScore / totalRatings).toFixed(1) : 0;
        
        return stats;
    }
    
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.progress));
    }
}

// ==================== NOTIFICATION SYSTEM ====================
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = new Map();
    }
    
    show(message, type = CONFIG.notifications.INFO, duration = 5000) {
        const id = Utils.generateId();
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Trigger show animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
        
        return id;
    }
    
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icon} me-2"></i>
                <span>${Utils.sanitizeHTML(message)}</span>
                <button class="btn-close ms-auto" onclick="notificationSystem.remove('${id}')"></button>
            </div>
        `;
        
        return notification;
    }
    
    getIcon(type) {
        const icons = {
            [CONFIG.notifications.SUCCESS]: 'fas fa-check-circle',
            [CONFIG.notifications.ERROR]: 'fas fa-exclamation-circle',
            [CONFIG.notifications.WARNING]: 'fas fa-exclamation-triangle',
            [CONFIG.notifications.INFO]: 'fas fa-info-circle'
        };
        return icons[type] || icons[CONFIG.notifications.INFO];
    }
    
    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }
    
    clear() {
        this.notifications.forEach((_, id) => this.remove(id));
    }
}

// ==================== MAIN APPLICATION CLASS ====================
class OtakuTrackApp {
    constructor() {
        this.api = new APIService();
        this.tracker = new ProgressTracker();
        this.notifications = new NotificationSystem();
        
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.searchCache = new Map();
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupScrollListener();
        this.initializeTooltips();
        await this.loadInitialData();
        this.updateStats();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const newTitleSearch = document.getElementById('newTitleSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(
                (e) => this.handleSearch(e.target.value), 
                CONFIG.debounce.search
            ));
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => 
                this.handleSearch(searchInput.value));
        }
        
        if (newTitleSearch) {
            newTitleSearch.addEventListener('input', Utils.debounce(
                (e) => this.handleNewTitleSearch(e.target.value),
                CONFIG.debounce.search
            ));
        }
        
        // Modal controls
        this.setupModalControls();
        
        // Progress controls
        this.setupProgressControls();
        
        // Quick actions
        this.setupQuickActions();
        
        // Filter and view controls
        this.setupFilterControls();
        
        // FAB
        const fab = document.getElementById('quickAddBtn');
        if (fab) {
            fab.addEventListener('click', () => this.showAddModal());
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Subscribe to progress changes
        this.tracker.subscribe(() => this.updateStats());
    }
    
    setupModalControls() {
        const addNewProgressBtn = document.getElementById('addNewProgressBtn');
        const closeAddModal = document.getElementById('closeAddModal');
        const cancelAddProgressBtn = document.getElementById('cancelAddProgressBtn');
        const confirmAddProgressBtn = document.getElementById('confirmAddProgressBtn');
        
        if (addNewProgressBtn) {
            addNewProgressBtn.addEventListener('click', () => this.showAddModal());
        }
        
        if (closeAddModal) {
            closeAddModal.addEventListener('click', () => this.hideAddModal());
        }
        
        if (cancelAddProgressBtn) {
            cancelAddProgressBtn.addEventListener('click', () => this.hideAddModal());
        }
        
        if (confirmAddProgressBtn) {
            confirmAddProgressBtn.addEventListener('click', () => this.addNewAnime());
        }
        
        // Progress modal
        const saveProgressBtn = document.getElementById('saveProgressBtn');
        const removeAnimeBtn = document.getElementById('removeAnimeBtn');
        
        if (saveProgressBtn) {
            saveProgressBtn.addEventListener('click', () => this.saveAnimeProgress());
        }
        
        if (removeAnimeBtn) {
            removeAnimeBtn.addEventListener('click', () => this.removeAnime());
        }
        
        // Update progress preview when values change
        const currentChapter = document.getElementById('currentChapter');
        const totalChapters = document.getElementById('totalChapters');
        
        if (currentChapter && totalChapters) {
            [currentChapter, totalChapters].forEach(input => {
                input.addEventListener('input', () => this.updateProgressPreview());
            });
        }
    }
    
    setupProgressControls() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            }
            
            if (e.target.classList.contains('view-btn')) {
                const view = e.target.dataset.view;
                this.setView(view);
            }
        });
    }
    
    setupQuickActions() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-card')) {
                const action = e.target.closest('.quick-action-card').dataset.action;
                this.handleQuickAction(action);
            }
        });
    }
    
    setupFilterControls() {
        // Trending tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tab = e.target.dataset.tab;
                this.setTrendingTab(tab);
            }
        });
    }
    
    setupScrollListener() {
        let ticking = false;
        
        const updateNavbar = () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        });
    }
    
    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => 
            new bootstrap.Tooltip(tooltipTriggerEl)
        );
    }
    
    async loadInitialData() {
        await Promise.all([
            this.loadUserProgress(),
            this.loadTrendingAnime(),
            this.loadRecommendations(),
            this.loadContinueWatching(),
            this.loadUpcomingEpisodes()
        ]);
    }
    
    async loadUserProgress() {
        const container = document.getElementById('currentProgressItems');
        const progress = this.tracker.getAllAnime();
        
        if (Object.keys(progress).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="text-center py-5">
                        <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                        <h3>No anime in your list yet</h3>
                        <p class="text-muted">Start tracking your anime journey by adding your first series!</p>
                        <button class="btn btn-primary" onclick="app.showAddModal()">
                            <i class="fas fa-plus me-2"></i>Add Your First Anime
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        const filteredProgress = this.getFilteredProgress(progress);
        
        for (const [id, data] of Object.entries(filteredProgress)) {
            try {
                const animeDetails = await this.api.getAnimeDetails(id) || this.createFallbackAnime(id, data);
                html += this.createProgressCard(id, animeDetails, data);
            } catch (error) {
                console.error(`Failed to load anime ${id}:`, error);
                const fallbackAnime = this.createFallbackAnime(id, data);
                html += this.createProgressCard(id, fallbackAnime, data);
            }
        }
        
        container.innerHTML = html || '<div class="text-center py-4">No anime found for the selected filter.</div>';
    }
    
    async loadTrendingAnime() {
        const container = document.getElementById('trendingContent');
        
        try {
            const trending = await this.api.getTrendingAnime();
            let html = '';
            
            trending.slice(0, 8).forEach(anime => {
                html += this.createAnimeCard(anime, 'trending');
            });
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Failed to load trending anime:', error);
            container.innerHTML = '<div class="text-center py-4">Failed to load trending anime.</div>';
        }
    }
    
    async loadRecommendations() {
        const container = document.getElementById('recommendations');
        
        try {
            // Get recommendations based on user's completed anime
            const completedAnime = this.tracker.getAnimeByStatus('completed');
            let recommendations = [];
            
            if (Object.keys(completedAnime).length > 0) {
                // In a real app, you'd use recommendation algorithms
                // For now, just show trending anime as recommendations
                recommendations = await this.api.getTrendingAnime();
            } else {
                recommendations = await this.api.getTrendingAnime();
            }
            
            let html = '';
            recommendations.slice(0, 4).forEach(anime => {
                html += this.createAnimeCard(anime, 'recommendation');
            });
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            container.innerHTML = '<div class="text-center py-4">Failed to load recommendations.</div>';
        }
    }
    
    async loadContinueWatching() {
        const container = document.getElementById('continue-watching');
        const watchingAnime = this.tracker.getAnimeByStatus('watching');
        
        if (Object.keys(watchingAnime).length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p>No anime currently being watched. <a href="#" onclick="app.showAddModal()">Add some anime</a> to get started!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        const entries = Object.entries(watchingAnime).slice(0, 4);
        
        for (const [id, data] of entries) {
            try {
                const animeDetails = await this.api.getAnimeDetails(id) || this.createFallbackAnime(id, data);
                html += this.createContinueWatchingCard(id, animeDetails, data);
            } catch (error) {
                console.error(`Failed to load anime ${id}:`, error);
            }
        }
        
        container.innerHTML = html;
    }
    
    loadUpcomingEpisodes() {
        const container = document.getElementById('upcoming-releases');
        const watchingAnime = this.tracker.getAnimeByStatus('watching');
        
        let html = '';
        const upcomingEpisodes = this.generateUpcomingEpisodes(watchingAnime);
        
        if (upcomingEpisodes.length === 0) {
            html = '<div class="text-center py-4">No upcoming episodes.</div>';
        } else {
            upcomingEpisodes.forEach(episode => {
                html += `
                    <div class="upcoming-item">
                        <div>
                            <div class="upcoming-title">${episode.title}</div>
                            <div class="upcoming-time">Episode ${episode.episode}</div>
                        </div>
                        <span class="badge bg-primary">${episode.timeUntil}</span>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
    }
    
    generateUpcomingEpisodes(watchingAnime) {
        // This is a mock function - in a real app, you'd get this from an API
        const episodes = [];
        const animeEntries = Object.entries(watchingAnime).slice(0, 5);
        
        animeEntries.forEach(([id, data], index) => {
            const nextEpisode = (data.currentEpisode || 0) + 1;
            const daysUntil = (index + 1) * 7; // Mock: episodes every week
            
            episodes.push({
                title: data.title || `Anime ${id}`,
                episode: nextEpisode,
                timeUntil: daysUntil === 1 ? '1 day' : `${daysUntil} days`
            });
        });
        
        return episodes;
    }
    
    // ==================== SEARCH FUNCTIONALITY ====================
    async handleSearch(query) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query || query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="p-3">Searching...</div>';
        
        try {
            const results = await this.api.searchAnime(query);
            
            if (results.data.length === 0) {
                resultsContainer.innerHTML = '<div class="p-3">No results found</div>';
                return;
            }
            
            let html = '';
            results.data.slice(0, 5).forEach(anime => {
                html += `
                    <div class="search-result-item p-3 border-bottom" onclick="app.selectSearchResult('${anime.id}', '${anime.title}', '${anime.image}')">
                        <div class="d-flex align-items-center">
                            <img src="${anime.image}" alt="${anime.title}" class="me-3" style="width: 50px; height: 70px; object-fit: cover; border-radius: 8px;">
                            <div>
                                <div class="fw-bold">${anime.title}</div>
                                <div class="small text-muted">${anime.episodes || '?'} episodes • ${anime.score || 'N/A'}/10</div>
                                <div class="small">${anime.genres.slice(0, 2).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            resultsContainer.innerHTML = html;
        } catch (error) {
            console.error('Search failed:', error);
            resultsContainer.innerHTML = '<div class="p-3 text-danger">Search failed</div>';
        }
    }
    
    async handleNewTitleSearch(query) {
        const resultsContainer = document.getElementById('newTitleResults');
        const confirmBtn = document.getElementById('confirmAddProgressBtn');
        
        if (!query || query.length < 2) {
            resultsContainer.style.display = 'none';
            confirmBtn.disabled = true;
            return;
        }
        
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="p-3">Searching...</div>';
        
        try {
            const results = await this.api.searchAnime(query);
            
            if (results.data.length === 0) {
                resultsContainer.innerHTML = '<div class="p-3">No results found</div>';
                confirmBtn.disabled = true;
                return;
            }
            
            let html = '';
            results.data.slice(0, 5).forEach(anime => {
                html += `
                    <div class="search-result-item p-3 border-bottom" onclick="app.selectNewAnime('${anime.id}', '${anime.title}', '${anime.image}', ${anime.episodes || 0})">
                        <div class="d-flex align-items-center">
                            <img src="${anime.image}" alt="${anime.title}" class="me-3" style="width: 50px; height: 70px; object-fit: cover; border-radius: 8px;">
                            <div>
                                <div class="fw-bold">${anime.title}</div>
                                <div class="small text-muted">${anime.episodes || '?'} episodes • ${anime.score || 'N/A'}/10</div>
                                <div class="small">${anime.genres.slice(0, 2).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            resultsContainer.innerHTML = html;
        } catch (error) {
            console.error('Search failed:', error);
            resultsContainer.innerHTML = '<div class="p-3 text-danger">Search failed</div>';
            confirmBtn.disabled = true;
        }
    }
    
    selectSearchResult(id, title, image) {
        // Hide search results
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchInput').value = '';
        
        // Open anime in progress modal or navigate to details
        this.openAnimeModal(id, title, image);
    }
    
    selectNewAnime(id, title, image, episodes) {
        this.selectedAnime = { id, title, image, episodes };
        
        // Update form
        document.getElementById('newTitleSearch').value = title;
        document.getElementById('totalProgressInput').value = episodes || '';
        document.getElementById('confirmAddProgressBtn').disabled = false;
        
        // Hide results
        document.getElementById('newTitleResults').style.display = 'none';
    }
    
    // ==================== MODAL FUNCTIONALITY ====================
    showAddModal() {
        const modal = document.getElementById('addProgressModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset form
        this.resetAddModal();
    }
    
    hideAddModal() {
        const modal = document.getElementById('addProgressModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        this.resetAddModal();
    }
    
    resetAddModal() {
        document.getElementById('newTitleSearch').value = '';
        document.getElementById('currentProgressInput').value = '0';
        document.getElementById('totalProgressInput').value = '';
        document.getElementById('statusSelect').value = 'plan_to_watch';
        document.getElementById('ratingSelect').value = '';
        document.getElementById('confirmAddProgressBtn').disabled = true;
        document.getElementById('newTitleResults').style.display = 'none';
        this.selectedAnime = null;
    }
    
    async openAnimeModal(id, title, image) {
        const modal = new bootstrap.Modal(document.getElementById('progressModal'));
        const progress = this.tracker.getAnime(id);
        
        // Set modal content
        document.getElementById('modalAnimeImage').src = image;
        document.getElementById('mediaTitle').value = title;
        
        if (progress) {
            document.getElementById('currentChapter').value = progress.currentEpisode || 0;
            document.getElementById('totalChapters').value = progress.totalEpisodes || '';
            document.getElementById('userRating').value = progress.rating || '';
            document.getElementById('statusSelectModal').value = progress.status || 'plan_to_watch';
        } else {
            document.getElementById('currentChapter').value = 0;
            document.getElementById('totalChapters').value = '';
            document.getElementById('userRating').value = '';
            document.getElementById('statusSelectModal').value = 'plan_to_watch';
        }
        
        this.currentAnimeId = id;
        this.updateProgressPreview();
        modal.show();
    }
    
    // ==================== PROGRESS MANAGEMENT ====================
    async addNewAnime() {
        if (!this.selectedAnime) {
            this.notifications.show('Please select an anime from the search results', CONFIG.notifications.WARNING);
            return;
        }
        
        const currentEpisode = parseInt(document.getElementById('currentProgressInput').value) || 0;
        const totalEpisodes = parseInt(document.getElementById('totalProgressInput').value) || null;
        const status = document.getElementById('statusSelect').value;
        const rating = document.getElementById('ratingSelect').value;
        
        const progressData = {
            title: this.selectedAnime.title,
            image: this.selectedAnime.image,
            currentEpisode,
            totalEpisodes,
            status,
            rating: rating || null
        };
        
        if (this.tracker.addAnime(this.selectedAnime.id, progressData)) {
            this.notifications.show(`Added "${this.selectedAnime.title}" to your list!`, CONFIG.notifications.SUCCESS);
            this.hideAddModal();
            await this.loadUserProgress();
            this.updateStats();
        } else {
            this.notifications.show('Failed to add anime', CONFIG.notifications.ERROR);
        }
    }
    
    saveAnimeProgress() {
        if (!this.currentAnimeId) return;
        
        const currentEpisode = parseInt(document.getElementById('currentChapter').value) || 0;
        const totalEpisodes = parseInt(document.getElementById('totalChapters').value) || null;
        const rating = document.getElementById('userRating').value;
        const status = document.getElementById('statusSelectModal').value;
        
        const updateData = {
            currentEpisode,
            totalEpisodes,
            rating: rating || null,
            status
        };
        
        if (this.tracker.updateAnime(this.currentAnimeId, updateData)) {
            this.notifications.show('Progress updated successfully!', CONFIG.notifications.SUCCESS);
            bootstrap.Modal.getInstance(document.getElementById('progressModal')).hide();
            this.loadUserProgress();
            this.updateStats();
        } else {
            this.notifications.show('Failed to update progress', CONFIG.notifications.ERROR);
        }
    }
    
    removeAnime() {
        if (!this.currentAnimeId) return;
        
        if (confirm('Are you sure you want to remove this anime from your list?')) {
            if (this.tracker.removeAnime(this.currentAnimeId)) {
                this.notifications.show('Anime removed from your list', CONFIG.notifications.SUCCESS);
                bootstrap.Modal.getInstance(document.getElementById('progressModal')).hide();
                this.loadUserProgress();
                this.updateStats();
            } else {
                this.notifications.show('Failed to remove anime', CONFIG.notifications.ERROR);
            }
        }
    }
    
    updateProgressPreview() {
        const current = parseInt(document.getElementById('currentChapter').value) || 0;
        const total = parseInt(document.getElementById('totalChapters').value) || 0;
        
        const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
        
        document.getElementById('progressPercentage').textContent = `${Math.round(percentage)}%`;
        document.getElementById('progressBar').style.width = `${percentage}%`;
    }
    
    // ==================== FILTER AND VIEW CONTROLS ====================
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.loadUserProgress();
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        // Update grid class
        const container = document.getElementById('currentProgressItems');
        if (view === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    }
    
    setTrendingTab(tab) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
        
        this.loadTrendingAnime(tab);
    }
    
    getFilteredProgress(progress) {
        if (this.currentFilter === 'all') {
            return progress;
        }
        
        return Object.entries(progress)
            .filter(([_, data]) => data.status === this.currentFilter)
            .reduce((acc, [id, data]) => ({ ...acc, [id]: data }), {});
    }
    
    // ==================== QUICK ACTIONS ====================
    async handleQuickAction(action) {
        switch (action) {
            case 'add-anime':
                this.showAddModal();
                break;
            case 'discover':
                await this.loadTrendingAnime();
                document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'trending':
                await this.loadTrendingAnime();
                document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'random':
                await this.showRandomAnime();
                break;
        }
    }
    
    async showRandomAnime() {
        try {
            const randomAnime = await this.api.getRandomAnime();
            this.notifications.show(`Random anime: ${randomAnime.title}`, CONFIG.notifications.INFO);
            // You could open a modal or navigate to the anime details
        } catch (error) {
            this.notifications.show('Failed to get random anime', CONFIG.notifications.ERROR);
        }
    }
    
    // ==================== CARD CREATION METHODS ====================
    createProgressCard(id, anime, progress) {
        const percentage = Utils.calculateProgress(progress.currentEpisode || 0, progress.totalEpisodes);
        const statusColor = Utils.getStatusColor(progress.status);
        const statusLabel = Utils.getStatusLabel(progress.status);
        
        return `
            <div class="progress-item" data-anime-id="${id}">
                <div class="d-flex align-items-start mb-3">
                    <img src="${anime.image}" alt="${anime.title}" class="anime-thumbnail me-3" style="width: 80px; height: 120px; object-fit: cover; border-radius: 12px;">
                    <div class="flex-grow-1">
                        <h3 class="h5 mb-2">${anime.title}</h3>
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge me-2" style="background-color: ${statusColor}">${statusLabel}</span>
                            ${anime.score ? `<div class="rating-display">
                                <span class="rating-stars">${this.generateStars(anime.score)}</span>
                                <span class="rating-score ms-1">${anime.score}/10</span>
                            </div>` : ''}
                        </div>
                        <div class="progress-info mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Episode ${progress.currentEpisode || 0}${progress.totalEpisodes ? ` of ${progress.totalEpisodes}` : ''}</span>
                                <span>${percentage}%</span>
                            </div>
                            ${progress.totalEpisodes ? `
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar" style="width: ${percentage}%"></div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="app.openAnimeModal('${id}', '${anime.title}', '${anime.image}')">
                                <i class="fas fa-edit me-1"></i>Update
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="app.quickUpdateEpisode('${id}', ${(progress.currentEpisode || 0) + 1})">
                                <i class="fas fa-plus me-1"></i>+1 Episode
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createAnimeCard(anime, type = 'default') {
        return `
            <div class="anime-card" onclick="app.openAnimeModal('${anime.id}', '${anime.title}', '${anime.image}')">
                <div class="position-relative">
                    <img src="${anime.image}" alt="${anime.title}" class="card-img-top">
                    ${anime.rank ? `<span class="position-absolute top-0 end-0 badge bg-warning m-2">#${anime.rank}</span>` : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${Utils.truncateText(anime.title, 30)}</h5>
                    ${anime.synopsis ? `<p class="card-text text-muted small">${Utils.truncateText(anime.synopsis, 100)}</p>` : ''}
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="rating-display">
                            ${anime.score ? `
                                <span class="rating-stars">${this.generateStars(anime.score)}</span>
                                <span class="rating-score ms-1">${anime.score}</span>
                            ` : 'Not Rated'}
                        </div>
                        <small class="text-muted">${anime.episodes || '?'} eps</small>
                    </div>
                    ${anime.genres ? `
                        <div class="mt-2">
                            ${anime.genres.slice(0, 2).map(genre => 
                                `<span class="badge bg-secondary me-1 small">${genre}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    createContinueWatchingCard(id, anime, progress) {
        const percentage = Utils.calculateProgress(progress.currentEpisode || 0, progress.totalEpisodes);
        
        return `
            <div class="col-md-6">
                <div class="anime-card continue-watching-card" onclick="app.openAnimeModal('${id}', '${anime.title}', '${anime.image}')">
                    <div class="position-relative">
                        <img src="${anime.image}" alt="${anime.title}" class="card-img-top" style="height: 200px;">
                        <div class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="small">Episode ${progress.currentEpisode || 0}${progress.totalEpisodes ? ` of ${progress.totalEpisodes}` : ''}</span>
                                <span class="small">${percentage}%</span>
                            </div>
                            ${progress.totalEpisodes ? `
                                <div class="progress mt-1" style="height: 4px;">
                                    <div class="progress-bar" style="width: ${percentage}%"></div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${Utils.truncateText(anime.title, 25)}</h5>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.quickUpdateEpisode('${id}', ${(progress.currentEpisode || 0) + 1})">
                                <i class="fas fa-play me-1"></i>Continue
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); app.openAnimeModal('${id}', '${anime.title}', '${anime.image}')">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStars(score) {
        const stars = Math.round(score / 2); // Convert 10-point to 5-star scale
        let html = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= stars) {
                html += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= stars) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        
        return html;
    }
    
    createFallbackAnime(id, data) {
        return {
            id,
            title: data.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            image: data.image || 'https://via.placeholder.com/300x400?text=No+Image',
            score: Math.floor(Math.random() * 3) + 7 + Math.random(),
            episodes: data.totalEpisodes || null,
            synopsis: 'No description available.',
            genres: ['Unknown']
        };
    }
    
    // ==================== QUICK UPDATE FUNCTIONALITY ====================
    quickUpdateEpisode(id, newEpisode) {
        const anime = this.tracker.getAnime(id);
        if (anime) {
            const updateData = {
                currentEpisode: newEpisode
            };
            
            // Auto-complete if reached total episodes
            if (anime.totalEpisodes && newEpisode >= anime.totalEpisodes) {
                updateData.status = 'completed';
                updateData.currentEpisode = anime.totalEpisodes;
            }
            
            if (this.tracker.updateAnime(id, updateData)) {
                const statusMessage = updateData.status === 'completed' 
                    ? `Completed "${anime.title}"!` 
                    : `Updated episode to ${newEpisode}`;
                
                this.notifications.show(statusMessage, CONFIG.notifications.SUCCESS);
                this.loadUserProgress();
                this.loadContinueWatching();
                this.updateStats();
            }
        }
    }
    
    // ==================== STATISTICS ====================
    updateStats() {
        const stats = this.tracker.getStats();
        
        // Update hero stats
        document.getElementById('totalAnimeCount').textContent = Utils.formatNumber(stats.total);
        document.getElementById('totalEpisodesCount').textContent = Utils.formatNumber(stats.totalEpisodes);
        document.getElementById('totalHoursCount').textContent = Utils.formatNumber(stats.totalHours);
        
        // Update sidebar stats
        document.getElementById('anime-count').textContent = stats.total;
        document.getElementById('episodes-watched').textContent = stats.totalEpisodes;
        document.getElementById('hours-watched').textContent = Math.round(stats.totalHours);
        document.getElementById('average-score').textContent = stats.averageScore;
        
        // Animate counters
        this.animateCounters();
    }
    
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            const increment = target / 30;
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    }
    
    // ==================== UTILITY METHODS ====================
    handleOutsideClick(e) {
        // Close search results
        if (!e.target.closest('#searchInput') && !e.target.closest('#searchResults')) {
            document.getElementById('searchResults').style.display = 'none';
        }
        
        if (!e.target.closest('#newTitleSearch') && !e.target.closest('#newTitleResults')) {
            const results = document.getElementById('newTitleResults');
            if (results) results.style.display = 'none';
        }
        
        // Close add modal when clicking overlay
        if (e.target.classList.contains('modal-overlay')) {
            this.hideAddModal();
        }
    }
}

// ==================== INITIALIZATION ====================
// Global instances
let app;
let notificationSystem;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new OtakuTrackApp();
        notificationSystem = app.notifications;
        
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            if (notificationSystem) {
                notificationSystem.show('An unexpected error occurred', CONFIG.notifications.ERROR);
            }
        });
        
        // Service worker registration (for future PWA features)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
        }
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Application Error</h4>
                    <p>Failed to initialize the application. Please refresh the page and try again.</p>
                </div>
            </div>
        `;
    }
});

// Export for global access (useful for debugging)
window.OtakuTrackApp = OtakuTrackApp;
window.Utils = Utils;