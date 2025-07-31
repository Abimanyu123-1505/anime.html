# 🎌 OtakuTrack - Anime Tracking Application

A modern, responsive anime tracking application built with vanilla HTML, CSS, and JavaScript. Track your anime progress, discover new series, and manage your watchlist with a beautiful, intuitive interface.

![OtakuTrack Preview](https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop&crop=center)

## ✨ Features

### 🔥 Core Features
- **Progress Tracking**: Keep track of your anime episodes watched
- **Real-time Search**: Search anime using the Jikan API (MyAnimeList)
- **Multiple Status Types**: Watching, Completed, On Hold, Dropped, Plan to Watch
- **Rating System**: Rate your anime from 1-10
- **Statistics Dashboard**: View your watching stats and progress
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🎨 Modern UI
- **Beautiful Gradients**: Eye-catching gradient designs
- **Smooth Animations**: Engaging hover effects and transitions
- **Dark Mode Support**: Automatic dark mode detection
- **Accessibility**: WCAG compliant with keyboard navigation
- **Modern Cards**: Clean, card-based layout with shadows and animations

### 🚀 Advanced Features
- **Trending Anime**: See what's popular right now
- **Quick Actions**: Fast episode updates with +1 buttons
- **Notifications**: Toast notifications for user actions
- **Local Storage**: Data persists across browser sessions
- **Filter & Sort**: Filter by status, view modes (grid/list)
- **Continue Watching**: Quick access to currently watching anime

### 📱 Progressive Web App Ready
- Service worker support for offline functionality
- Responsive design for all screen sizes
- Touch-friendly interface for mobile devices

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **API**: Jikan API (MyAnimeList unofficial API)
- **Storage**: Local Storage for data persistence
- **Styling**: CSS Custom Properties, Flexbox, Grid
- **Icons**: Font Awesome 6
- **Typography**: Google Fonts (Poppins)
- **Framework**: Bootstrap 5.3 for components

## 🚀 Quick Start

1. **Clone or Download**
   ```bash
   git clone <repository-url>
   cd otakutrack
   ```

2. **Open in Browser**
   - Simply open `index.html` in your web browser
   - No build process required!

3. **Or Use a Local Server** (Recommended)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using Live Server VS Code extension
   # Right-click on index.html and select "Open with Live Server"
   ```

4. **Access the Application**
   - Open your browser and go to `http://localhost:8000`

## 📖 Usage Guide

### Getting Started
1. **Add Your First Anime**
   - Click the "Add New" button or the floating action button (+)
   - Search for an anime title
   - Select from the search results
   - Set your current episode and status
   - Click "Add Anime"

2. **Update Progress**
   - Use the "+1 Episode" button for quick updates
   - Click "Update" to open the detailed progress modal
   - Modify episodes, rating, and status as needed

3. **Browse and Discover**
   - Check out the "Trending Now" section
   - Use the search bar to find specific anime
   - Click "Random" for a surprise recommendation

### Interface Overview

#### Hero Section
- Displays your overall statistics
- Shows total anime tracked, episodes watched, and hours viewed

#### Quick Actions
- **Add Anime**: Start tracking a new series
- **Discover**: Browse trending and popular anime
- **Trending**: See what's currently popular
- **Random**: Get a random anime suggestion

#### Your Progress
- Filter by status (All, Watching, Completed, etc.)
- Switch between grid and list views
- Quick episode updates and detailed editing

#### Sidebar
- **Upcoming Episodes**: See when new episodes release
- **Your Stats**: Detailed statistics about your watching habits

## 🎨 Customization

### Color Scheme
The application uses CSS custom properties for easy theming:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    /* ... more variables */
}
```

### API Configuration
To use different APIs or endpoints, modify the `CONFIG` object in `script.js`:

```javascript
const CONFIG = {
    hianime: {
        baseURL: 'https://your-api-endpoint.com',
        endpoints: {
            search: '/anime/search',
            // ... other endpoints
        }
    }
};
```

## 🔧 API Integration

### Current API Setup
The application uses the **Jikan API** (unofficial MyAnimeList API) as the primary data source:

- **Search**: Real-time anime search with debouncing
- **Details**: Comprehensive anime information
- **Trending**: Popular and top-rated anime
- **Random**: Random anime discovery

### HiAnime.to Integration Notes
While the application is designed to work with HiAnime.to, the actual API endpoints are configured to use Jikan API for reliability. To integrate with HiAnime.to:

1. Update the API configuration in `script.js`
2. Modify the data mapping functions
3. Handle authentication if required

## 🔒 Data Storage

### Local Storage Structure
```javascript
// User progress data
{
    "anime_id": {
        "title": "Anime Title",
        "image": "image_url",
        "currentEpisode": 12,
        "totalEpisodes": 24,
        "status": "watching",
        "rating": 8,
        "addedAt": 1640995200000,
        "updatedAt": 1640995200000
    }
}
```

### Storage Keys
- `otakutrack_progress`: User's anime progress data
- `otakutrack_settings`: User preferences (future feature)
- `otakutrack_cache`: API response caching

## 🌟 Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Required Features
- ES6+ Support
- CSS Grid and Flexbox
- Fetch API
- Local Storage
- CSS Custom Properties

## 🎯 Performance

### Optimization Features
- **API Caching**: 5-minute cache for API responses
- **Debounced Search**: Reduced API calls during typing
- **Lazy Loading**: Images load as needed
- **Optimized Animations**: GPU-accelerated transforms
- **Minimal Dependencies**: Vanilla JS for better performance

## 🔧 Development

### File Structure
```
otakutrack/
├── index.html          # Main HTML file
├── styles.css          # Comprehensive styling
├── script.js           # Application logic
├── README.md           # This file
└── assets/            # Future: images, icons
```

### Key Classes
- `OtakuTrackApp`: Main application controller
- `APIService`: Handles all API communications
- `ProgressTracker`: Manages user progress data
- `NotificationSystem`: Toast notifications
- `Utils`: Utility functions

### Adding New Features
1. **API Features**: Extend the `APIService` class
2. **UI Components**: Add methods to `OtakuTrackApp`
3. **Storage**: Extend the `ProgressTracker` class
4. **Styling**: Add CSS to the appropriate section in `styles.css`

## 🐛 Troubleshooting

### Common Issues

1. **Search Not Working**
   - Check browser console for CORS errors
   - Verify internet connection
   - Try using a local server instead of file:// protocol

2. **Data Not Saving**
   - Ensure Local Storage is enabled
   - Check browser privacy settings
   - Verify localStorage quota hasn't been exceeded

3. **Images Not Loading**
   - Check if third-party cookies are blocked
   - Verify image URLs in browser network tab
   - Some anime images may have CORS restrictions

4. **Mobile Display Issues**
   - Ensure viewport meta tag is present
   - Check for CSS compatibility with older mobile browsers
   - Test in device developer tools

## 📚 API Reference

### Jikan API Endpoints Used
- `GET /anime?q={query}` - Search anime
- `GET /anime/{id}/full` - Get anime details
- `GET /top/anime` - Get top/trending anime
- `GET /random/anime` - Get random anime

### Rate Limits
- Jikan API: 3 requests per second, 60 per minute
- Built-in caching reduces API calls
- Debounced search prevents spam

## 🤝 Contributing

### Ways to Contribute
1. **Bug Reports**: Open an issue with details
2. **Feature Requests**: Suggest new functionality
3. **Code Contributions**: Submit pull requests
4. **Documentation**: Improve README or code comments
5. **Design**: Suggest UI/UX improvements

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **MyAnimeList**: For the comprehensive anime database
- **Jikan API**: For providing free access to MAL data
- **Bootstrap**: For the component framework
- **Font Awesome**: For the beautiful icons
- **Google Fonts**: For the Poppins typography
- **Unsplash**: For high-quality placeholder images

## 🔮 Future Features

### Planned Enhancements
- [ ] **User Authentication**: Login/register functionality
- [ ] **Cloud Sync**: Sync data across devices
- [ ] **Social Features**: Follow friends, share lists
- [ ] **Advanced Statistics**: Detailed analytics and charts
- [ ] **Recommendation Engine**: AI-powered anime suggestions
- [ ] **Themes**: Multiple color schemes and themes
- [ ] **Export/Import**: Backup and restore functionality
- [ ] **Offline Mode**: Full offline functionality with sync
- [ ] **Episode Tracking**: Link to streaming services
- [ ] **Manga Support**: Track manga and manhwa progress

### Long-term Goals
- Native mobile apps
- Browser extension
- Integration with streaming platforms
- Community features and forums

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join our community discussions

---

**Made with ❤️ for the anime community**

*Start tracking your anime journey today!* 🚀