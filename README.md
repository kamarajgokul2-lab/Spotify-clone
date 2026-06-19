# 🎵 GK Music — Premium Music Streaming App

A Spotify-inspired music streaming web application built with pure HTML, CSS, and JavaScript.

## 🚀 Features

- **Full Music Player** — Play/Pause, Next/Previous, Seek, Volume, Shuffle, Repeat
- **Fullscreen Player** — Immersive experience with album art animation
- **Smart Search** — Fuzzy search, prefix match, keyword match, multi-field
- **Admin Dashboard** — Upload, edit, delete songs (login: admin / gkmusic2024)
- **Playlists** — Create and manage personal playlists
- **Liked Songs** — Save your favorites
- **Recently Played** — Track listening history
- **Recommendations** — Genre, artist, and tag-based suggestions
- **Responsive Design** — Desktop and mobile optimized
- **Dark Theme** — Premium Spotify-inspired UI with glassmorphism

## 📁 Project Structure

```
/index.html          — Main app
/css/style.css       — All styles
/js/db.js            — Database manager (localStorage + JSON)
/js/search.js        — Smart search engine
/js/ui.js            — UI rendering
/js/player.js        — Music player logic
/js/app.js           — Main app controller
/data/songs.json     — Song database
/assets/covers/      — Album art (SVG placeholders)
/assets/music/       — Audio files (add MP3s here)
```

## 🌐 GitHub Pages Deployment

1. Push all files to a GitHub repository
2. Go to Settings → Pages → Source: `main` branch, `/ (root)`
3. Your site will be live at `https://yourusername.github.io/repo-name/`

## 🔐 Admin Login

- Username: `admin`
- Password: `gkmusic2024`

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| → | Next Song |
| ← | Previous Song |
| ↑ | Volume Up |
| ↓ | Volume Down |
| F | Fullscreen Player |
| Escape | Close Fullscreen |

## 🎵 Adding Real Music

1. Place MP3 files in `/assets/music/`
2. Place album art in `/assets/covers/`
3. Edit `/data/songs.json` to update paths
4. Or use Admin Dashboard to upload songs

## 🔍 Search Examples

Type any of these to find "Leave Me Alone":
- `leave`
- `lea`  
- `me`
- `alone`
- `leave me`
- `leave alone`
