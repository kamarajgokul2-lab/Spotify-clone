// ==========================================
// GK MUSIC — Database Manager
// Handles localStorage persistence + JSON data
// ==========================================

class DB {
  static KEY_SONGS = 'gkmusic_songs';
  static KEY_LIKES = 'gkmusic_likes';
  static KEY_PLAYLISTS = 'gkmusic_playlists';
  static KEY_RECENTLY = 'gkmusic_recently';
  static KEY_PLAYS = 'gkmusic_plays';
  static KEY_AUTH = 'gkmusic_admin_auth';

  static _songs = null;
  static _initialized = false;

  // ─── Init: load from JSON then merge localStorage overrides ───
  static async init() {
    if (this._initialized) return;
    try {
      const res = await fetch('./data/songs.json');
      const data = await res.json();
      // Check localStorage for admin-added songs
      const stored = localStorage.getItem(this.KEY_SONGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge: localStorage overrides base JSON
        this._songs = parsed;
      } else {
        this._songs = data.songs;
        // Save initial nextId
        if (!localStorage.getItem('gkmusic_nextId')) {
          localStorage.setItem('gkmusic_nextId', data.nextId || 13);
        }
      }
    } catch (e) {
      console.warn('Could not load songs.json, using localStorage', e);
      const stored = localStorage.getItem(this.KEY_SONGS);
      this._songs = stored ? JSON.parse(stored) : [];
    }
    this._initialized = true;
  }

  // ─── Songs ───
  static getAllSongs() {
    return this._songs || [];
  }

  static getSongById(id) {
    return this._songs.find(s => s.id === id);
  }

  static addSong(song) {
    const nextId = parseInt(localStorage.getItem('gkmusic_nextId') || '100');
    song.id = nextId;
    song.plays = 0;
    song.likes = 0;
    song.uploadDate = new Date().toISOString().split('T')[0];
    song.trending = false;
    this._songs.push(song);
    this._persist();
    localStorage.setItem('gkmusic_nextId', nextId + 1);
    return song;
  }

  static updateSong(id, updates) {
    const idx = this._songs.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this._songs[idx] = { ...this._songs[idx], ...updates };
    this._persist();
    return true;
  }

  static deleteSong(id) {
    this._songs = this._songs.filter(s => s.id !== id);
    this._persist();
  }

  static _persist() {
    localStorage.setItem(this.KEY_SONGS, JSON.stringify(this._songs));
  }

  // ─── Likes ───
  static getLikes() {
    const stored = localStorage.getItem(this.KEY_LIKES);
    return stored ? JSON.parse(stored) : [];
  }

  static toggleLike(id) {
    const likes = this.getLikes();
    const idx = likes.indexOf(id);
    if (idx === -1) {
      likes.push(id);
      // Increment song likes
      const song = this.getSongById(id);
      if (song) this.updateSong(id, { likes: (song.likes || 0) + 1 });
    } else {
      likes.splice(idx, 1);
      const song = this.getSongById(id);
      if (song) this.updateSong(id, { likes: Math.max(0, (song.likes || 0) - 1) });
    }
    localStorage.setItem(this.KEY_LIKES, JSON.stringify(likes));
    return idx === -1; // true if now liked
  }

  static isLiked(id) {
    return this.getLikes().includes(id);
  }

  static getLikedSongs() {
    const likes = this.getLikes();
    return this._songs.filter(s => likes.includes(s.id));
  }

  // ─── Recently Played ───
  static getRecentlyPlayed() {
    const stored = localStorage.getItem(this.KEY_RECENTLY);
    return stored ? JSON.parse(stored) : [];
  }

  static addToRecent(id) {
    let recent = this.getRecentlyPlayed();
    recent = recent.filter(r => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 20);
    localStorage.setItem(this.KEY_RECENTLY, JSON.stringify(recent));
  }

  static getRecentlyPlayedSongs(limit = 10) {
    const ids = this.getRecentlyPlayed().slice(0, limit);
    return ids.map(id => this.getSongById(id)).filter(Boolean);
  }

  // ─── Play Count ───
  static incrementPlay(id) {
    const song = this.getSongById(id);
    if (song) this.updateSong(id, { plays: (song.plays || 0) + 1 });
  }

  // ─── Playlists ───
  static getPlaylists() {
    const stored = localStorage.getItem(this.KEY_PLAYLISTS);
    return stored ? JSON.parse(stored) : [];
  }

  static createPlaylist(name) {
    const playlists = this.getPlaylists();
    const pl = {
      id: Date.now(),
      name,
      songs: [],
      created: new Date().toISOString()
    };
    playlists.push(pl);
    localStorage.setItem(this.KEY_PLAYLISTS, JSON.stringify(playlists));
    return pl;
  }

  static addToPlaylist(playlistId, songId) {
    const playlists = this.getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;
    if (!pl.songs.includes(songId)) {
      pl.songs.push(songId);
      localStorage.setItem(this.KEY_PLAYLISTS, JSON.stringify(playlists));
    }
    return true;
  }

  static removeFromPlaylist(playlistId, songId) {
    const playlists = this.getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;
    pl.songs = pl.songs.filter(s => s !== songId);
    localStorage.setItem(this.KEY_PLAYLISTS, JSON.stringify(playlists));
    return true;
  }

  static deletePlaylist(id) {
    const playlists = this.getPlaylists().filter(p => p.id !== id);
    localStorage.setItem(this.KEY_PLAYLISTS, JSON.stringify(playlists));
  }

  static getPlaylistSongs(playlistId) {
    const pl = this.getPlaylists().find(p => p.id === playlistId);
    if (!pl) return [];
    return pl.songs.map(id => this.getSongById(id)).filter(Boolean);
  }

  // ─── Queries ───
  static getTrending(limit = 10) {
    return [...this._songs]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, limit);
  }

  static getLatest(limit = 10) {
    return [...this._songs]
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, limit);
  }

  static getByGenre(genre, limit = 20) {
    return this._songs
      .filter(s => s.genre.toLowerCase() === genre.toLowerCase())
      .slice(0, limit);
  }

  static getByLanguage(lang, limit = 20) {
    return this._songs
      .filter(s => s.language.toLowerCase() === lang.toLowerCase())
      .slice(0, limit);
  }

  static getRecommendations(currentSong, limit = 6) {
    if (!currentSong) return this.getTrending(limit);
    const songs = this._songs.filter(s => s.id !== currentSong.id);
    const scored = songs.map(s => {
      let score = 0;
      if (s.genre === currentSong.genre) score += 10;
      if (s.artist === currentSong.artist) score += 8;
      if (s.language === currentSong.language) score += 5;
      // Tag overlap
      const sharedTags = (s.tags || []).filter(t => (currentSong.tags || []).includes(t));
      score += sharedTags.length * 3;
      score += Math.random() * 2; // slight randomness
      return { song: s, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.song);
  }

  // ─── Auth ───
  static isAdminLoggedIn() {
    return localStorage.getItem(this.KEY_AUTH) === 'true';
  }

  static adminLogin(username, password) {
    // In production, this would be a real auth call
    if (username === 'admin' && password === 'gkmusic2024') {
      localStorage.setItem(this.KEY_AUTH, 'true');
      return true;
    }
    return false;
  }

  static adminLogout() {
    localStorage.removeItem(this.KEY_AUTH);
  }
}
