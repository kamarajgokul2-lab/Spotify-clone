// ==========================================
// GK MUSIC — UI Renderer
// Generates HTML for all UI components
// ==========================================

class UI {
  // ─── Song Card (Grid) ───
  static songCard(song) {
    const liked = DB.isLiked(song.id);
    return `
      <div class="song-card" data-id="${song.id}" onclick="App.playSong(${song.id})">
        <div class="song-card-cover">
          <img src="${song.cover}" alt="${this.esc(song.title)}" loading="lazy"
               onerror="this.src='assets/covers/default1.svg'">
          <div class="song-card-overlay">
            <button class="song-card-play-btn" aria-label="Play ${this.esc(song.title)}">▶</button>
          </div>
        </div>
        <div class="song-card-body">
          <div class="song-card-title">${this.esc(song.title)}</div>
          <div class="song-card-artist">${this.esc(song.artist)}</div>
          <div class="song-card-meta">
            <span class="song-card-genre">${this.esc(song.genre)}</span>
            <button class="song-card-like ${liked ? 'liked' : ''}"
              onclick="App.toggleLike(event, ${song.id})"
              aria-label="${liked ? 'Unlike' : 'Like'}">${liked ? '❤️' : '🤍'}</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Song Row (List) ───
  static songRow(song, index, showAlbum = true) {
    const liked = DB.isLiked(song.id);
    const duration = this.fmtDuration(song.duration);
    return `
      <div class="song-row" data-id="${song.id}" onclick="App.playSong(${song.id})">
        <div class="song-row-num">
          <span>${index + 1}</span>
          <span class="song-row-play-icon">▶</span>
        </div>
        <div class="song-row-cover">
          <img src="${song.cover}" alt="${this.esc(song.title)}" loading="lazy"
               onerror="this.src='assets/covers/default1.svg'">
          <div class="song-row-wave">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="song-row-info">
          <div class="title">${this.esc(song.title)}</div>
          <div class="artist">${this.esc(song.artist)}</div>
        </div>
        ${showAlbum ? `<div class="song-row-album">${this.esc(song.album || song.genre)}</div>` : ''}
        <div class="song-row-actions">
          <button class="song-row-action-btn ${liked ? 'liked' : ''}"
            onclick="App.toggleLike(event, ${song.id})">${liked ? '❤️' : '🤍'}</button>
          <button class="song-row-action-btn" onclick="App.openContextMenu(event, ${song.id})">⋯</button>
        </div>
        <div class="song-row-duration">${duration}</div>
      </div>
    `;
  }

  // ─── Songs Grid ───
  static songsGrid(songs, label = '') {
    if (!songs.length) return this.emptyState('No songs found', 'Try a different search or genre.');
    return `<div class="songs-grid">${songs.map(s => this.songCard(s)).join('')}</div>`;
  }

  // ─── Songs List with header ───
  static songsList(songs) {
    if (!songs.length) return this.emptyState('No songs here yet', 'Add some songs to get started.');
    return `
      <div class="songs-list-header">
        <span>#</span><span></span>
        <span>Title</span>
        <span>Album</span>
        <span></span>
        <span>⏱</span>
      </div>
      <div class="songs-list">
        ${songs.map((s, i) => this.songRow(s, i)).join('')}
      </div>
    `;
  }

  // ─── Horizontal Scroll Row ───
  static scrollRow(songs) {
    return `<div class="scroll-row">${songs.map(s => this.songCard(s)).join('')}</div>`;
  }

  // ─── Playlist Card ───
  static playlistCard(playlist) {
    const songs = DB.getPlaylistSongs(playlist.id).slice(0, 4);
    const coverHtml = songs.length === 0
      ? `<div class="playlist-cover empty">🎵</div>`
      : `<div class="playlist-cover">
          ${songs.map(s => `<img src="${s.cover}" alt="" onerror="this.src='assets/covers/default1.svg'">`).join('')}
        </div>`;
    return `
      <div class="playlist-card" onclick="App.openPlaylist(${playlist.id})">
        ${coverHtml}
        <div class="playlist-info">
          <div class="playlist-name">${this.esc(playlist.name)}</div>
          <div class="playlist-count">${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
  }

  // ─── Search Result Item ───
  static searchResultItem(song) {
    return `
      <div class="search-result-item" onclick="App.playSong(${song.id}); App.closeSearch();">
        <img src="${song.cover}" alt="${this.esc(song.title)}"
             onerror="this.src='assets/covers/default1.svg'">
        <div class="search-result-info">
          <div class="title">${this.esc(song.title)}</div>
          <div class="subtitle">${this.esc(song.artist)} • ${this.esc(song.genre)}</div>
        </div>
        <span class="match-type">${SearchEngine.getMatchLabel(song._matchType)}</span>
      </div>
    `;
  }

  // ─── Admin Songs Table Row ───
  static adminSongRow(song) {
    return `
      <tr>
        <td><img src="${song.cover}" class="cover-thumb" alt=""
             onerror="this.src='assets/covers/default1.svg'"></td>
        <td>${this.esc(song.title)}</td>
        <td>${this.esc(song.artist)}</td>
        <td>${this.esc(song.genre)}</td>
        <td>${this.esc(song.language)}</td>
        <td>${song.plays || 0}</td>
        <td>${song.uploadDate || '—'}</td>
        <td>
          <div class="table-actions">
            <button class="table-btn edit" onclick="App.editSong(${song.id})">Edit</button>
            <button class="table-btn delete" onclick="App.deleteSong(${song.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  // ─── Empty State ───
  static emptyState(title, desc) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🎵</div>
        <h3>${this.esc(title)}</h3>
        <p>${this.esc(desc)}</p>
      </div>
    `;
  }

  // ─── Context Menu ───
  static contextMenu(song, x, y) {
    const playlists = DB.getPlaylists();
    const liked = DB.isLiked(song.id);
    return `
      <div class="context-menu visible" id="contextMenu" style="top:${y}px;left:${x}px"
           onclick="event.stopPropagation()">
        <div class="context-menu-item" onclick="App.playSong(${song.id}); App.closeContextMenu()">
          <span class="icon">▶</span> Play Now
        </div>
        <div class="context-menu-item" onclick="App.addToQueue(${song.id}); App.closeContextMenu()">
          <span class="icon">📋</span> Add to Queue
        </div>
        <div class="context-menu-sep"></div>
        <div class="context-menu-item" onclick="App.toggleLikeById(${song.id}); App.closeContextMenu()">
          <span class="icon">${liked ? '❤️' : '🤍'}</span> ${liked ? 'Remove from Liked' : 'Add to Liked'}
        </div>
        ${playlists.length ? `
          <div class="context-menu-sep"></div>
          <div class="context-menu-item" style="cursor:default;opacity:0.6">
            <span class="icon">➕</span> Add to Playlist
          </div>
          ${playlists.map(pl => `
            <div class="context-menu-item" style="padding-left:28px"
                 onclick="App.addSongToPlaylist(${song.id}, ${pl.id}); App.closeContextMenu()">
              <span class="icon">🎵</span> ${this.esc(pl.name)}
            </div>
          `).join('')}
        ` : ''}
        <div class="context-menu-sep"></div>
        <div class="context-menu-item" onclick="App.shareGenre('${song.genre}'); App.closeContextMenu()">
          <span class="icon">🔍</span> More like this
        </div>
      </div>
    `;
  }

  // ─── Utils ───
  static esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  static fmtDuration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
