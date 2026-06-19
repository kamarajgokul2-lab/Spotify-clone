// ==========================================
// GK MUSIC — Main App Controller
// ==========================================

const App = {
  player: null,
  currentPage: 'home',
  currentPlaylistId: null,
  contextSongId: null,
  _searchTimeout: null,

  // ─── Init ───
  async init() {
    await DB.init();
    this.player = new Player();
    this._renderSidebar();
    this._bindNav();
    this._bindSearch();
    this._bindAdminEvents();
    this.navigateTo('home');
    this._renderPlayer();
    console.log('🎵 GK Music initialized');
  },

  // ─── Navigation ───
  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');
    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');
    this._renderPage(page);
    window.scrollTo(0, 0);
  },

  _renderPage(page) {
    switch (page) {
      case 'home': this._renderHome(); break;
      case 'search': this._renderSearchPage(); break;
      case 'library': this._renderLibrary(); break;
      case 'liked': this._renderLiked(); break;
      case 'recent': this._renderRecent(); break;
      case 'playlists': this._renderPlaylists(); break;
      case 'admin': this._renderAdmin(); break;
    }
  },

  // ─── Home Page ───
  _renderHome() {
    const songs = DB.getAllSongs();
    const trending = DB.getTrending(10);
    const latest = DB.getLatest(8);
    const tamil = DB.getByLanguage('Tamil', 8);
    const english = DB.getByLanguage('English', 8);
    const liked = DB.getLikedSongs().slice(0, 6);
    const recent = DB.getRecentlyPlayedSongs(8);
    const recommended = DB.getRecommendations(this.player?.currentSong, 6);

    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    let html = `
      <div class="hero-banner">
        <div class="hero-greeting">${greet} 👋</div>
        <h1 class="hero-title">Your Music,<br><span class="highlight">Your Mood.</span></h1>
        <p class="hero-subtitle">Stream the best Tamil & English hits — ad-free, always.</p>
        <div class="hero-actions">
          <button class="hero-btn primary" onclick="App.player.setQueue(${JSON.stringify([...trending].map(s=>s.id))}, 0); App.player.load(DB.getAllSongs().find(s=>s.id===${trending[0]?.id}))">
            ▶ Play Trending
          </button>
          <button class="hero-btn secondary" onclick="App.navigateTo('search')">🔍 Browse All</button>
        </div>
        <div class="hero-wave">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div>
        </div>
      </div>
    `;

    if (recent.length) {
      html += `
        <div class="content-section">
          <div class="section-header">
            <div><div class="section-title">🕒 Recently Played</div></div>
            <span class="section-see-all" onclick="App.navigateTo('recent')">See all</span>
          </div>
          ${UI.scrollRow(recent)}
        </div>`;
    }

    html += `
      <div class="content-section">
        <div class="section-header">
          <div><div class="section-title">🔥 Trending Now</div></div>
          <span class="section-see-all" onclick="App.navigateTo('search')">See all</span>
        </div>
        ${UI.scrollRow(trending)}
      </div>
      <div class="content-section">
        <div class="section-header">
          <div><div class="section-title">✨ Latest Uploads</div></div>
        </div>
        ${UI.scrollRow(latest)}
      </div>
    `;

    if (tamil.length) {
      html += `
        <div class="content-section">
          <div class="section-header">
            <div><div class="section-title">🎵 Tamil Hits</div></div>
            <span class="section-see-all" onclick="App.filterByLanguage('Tamil')">See all</span>
          </div>
          ${UI.scrollRow(tamil)}
        </div>`;
    }

    if (english.length) {
      html += `
        <div class="content-section">
          <div class="section-header">
            <div><div class="section-title">🎸 English Hits</div></div>
            <span class="section-see-all" onclick="App.filterByLanguage('English')">See all</span>
          </div>
          ${UI.scrollRow(english)}
        </div>`;
    }

    if (liked.length) {
      html += `
        <div class="content-section">
          <div class="section-header">
            <div><div class="section-title">❤️ Your Favourites</div></div>
            <span class="section-see-all" onclick="App.navigateTo('liked')">See all</span>
          </div>
          ${UI.scrollRow(liked)}
        </div>`;
    }

    if (recommended.length) {
      html += `
        <div class="content-section">
          <div class="section-header">
            <div>
              <div class="section-title">🤖 Recommended For You</div>
              <div class="section-subtitle">Based on your listening history</div>
            </div>
          </div>
          ${UI.songsGrid(recommended)}
        </div>`;
    }

    html += '<div style="height:32px"></div>';
    document.getElementById('page-home').innerHTML = html;
  },

  // ─── Search Page ───
  _renderSearchPage() {
    const genres = [...new Set(DB.getAllSongs().map(s => s.genre))];
    const languages = [...new Set(DB.getAllSongs().map(s => s.language))];
    const songs = DB.getAllSongs();

    let html = `
      <div class="content-section">
        <div class="section-header"><div class="section-title">🔍 Browse Music</div></div>
        <div class="filter-chips">
          <span class="chip active" onclick="App._filterChipClick(this, 'all')">All</span>
          ${languages.map(l => `<span class="chip" onclick="App._filterChipClick(this, 'lang:${l}')">${l}</span>`).join('')}
          ${genres.map(g => `<span class="chip" onclick="App._filterChipClick(this, 'genre:${g}')">${g}</span>`).join('')}
        </div>
        <div id="searchPageResults">
          ${UI.songsList(songs)}
        </div>
      </div>
    `;
    document.getElementById('page-search').innerHTML = html;
  },

  _filterChipClick(chipEl, filter) {
    document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');
    let songs;
    if (filter === 'all') songs = DB.getAllSongs();
    else if (filter.startsWith('lang:')) songs = DB.getByLanguage(filter.split(':')[1]);
    else if (filter.startsWith('genre:')) songs = DB.getByGenre(filter.split(':')[1]);
    else songs = DB.getAllSongs();
    const el = document.getElementById('searchPageResults');
    if (el) el.innerHTML = UI.songsList(songs);
  },

  filterByLanguage(lang) {
    this.navigateTo('search');
    setTimeout(() => {
      const chip = [...document.querySelectorAll('.filter-chips .chip')]
        .find(c => c.textContent.trim() === lang);
      if (chip) this._filterChipClick(chip, `lang:${lang}`);
    }, 50);
  },

  // ─── Library ───
  _renderLibrary() {
    const songs = DB.getAllSongs();
    document.getElementById('page-library').innerHTML = `
      <div class="content-section">
        <div class="section-header"><div class="section-title">🎵 All Songs</div></div>
        ${UI.songsList(songs)}
      </div>
    `;
  },

  // ─── Liked ───
  _renderLiked() {
    const songs = DB.getLikedSongs();
    document.getElementById('page-liked').innerHTML = `
      <div class="content-section">
        <div class="section-header"><div class="section-title">❤️ Liked Songs</div></div>
        ${songs.length ? UI.songsList(songs) : UI.emptyState('No liked songs yet', 'Tap ❤ on any song to save it here.')}
      </div>
    `;
  },

  // ─── Recent ───
  _renderRecent() {
    const songs = DB.getRecentlyPlayedSongs(20);
    document.getElementById('page-recent').innerHTML = `
      <div class="content-section">
        <div class="section-header"><div class="section-title">🕒 Recently Played</div></div>
        ${songs.length ? UI.songsList(songs) : UI.emptyState('Nothing played yet', 'Start listening and songs will appear here.')}
      </div>
    `;
  },

  // ─── Playlists ───
  _renderPlaylists() {
    const playlists = DB.getPlaylists();
    let html = `
      <div class="content-section">
        <div class="section-header">
          <div class="section-title">📂 Your Playlists</div>
        </div>
        <div class="playlists-grid">
          <div class="create-playlist-btn" onclick="App.createPlaylistModal()">
            <span class="plus">+</span>
            <span>Create Playlist</span>
          </div>
          ${playlists.map(pl => UI.playlistCard(pl)).join('')}
        </div>
        <div id="playlistSongsArea"></div>
      </div>
    `;
    document.getElementById('page-playlists').innerHTML = html;
  },

  openPlaylist(playlistId) {
    const pl = DB.getPlaylists().find(p => p.id === playlistId);
    if (!pl) return;
    this.currentPlaylistId = playlistId;
    const songs = DB.getPlaylistSongs(playlistId);
    const el = document.getElementById('playlistSongsArea');
    if (!el) return;
    el.innerHTML = `
      <div style="margin-top:32px">
        <div class="section-header">
          <div>
            <div class="section-title">🎵 ${UI.esc(pl.name)}</div>
            <div class="section-subtitle">${songs.length} songs</div>
          </div>
          <button class="topbar-btn outline" style="padding:8px 16px;font-size:13px"
                  onclick="App.deletePlaylistConfirm(${playlistId})">🗑 Delete</button>
        </div>
        ${songs.length ? `
          <button class="hero-btn primary" style="margin-bottom:20px"
                  onclick="App.playPlaylist(${playlistId})">▶ Play All</button>
          ${UI.songsList(songs)}
        ` : UI.emptyState('Playlist is empty', 'Right-click any song to add it here.')}
      </div>
    `;
    el.scrollIntoView({ behavior: 'smooth' });
  },

  playPlaylist(playlistId) {
    const songs = DB.getPlaylistSongs(playlistId);
    if (songs.length) this.player.setQueue(songs, 0);
  },

  createPlaylistModal() {
    const name = prompt('Enter playlist name:');
    if (!name || !name.trim()) return;
    const pl = DB.createPlaylist(name.trim());
    this._renderPlaylists();
    this._renderSidebar();
    this.toast(`✅ Playlist "${pl.name}" created!`, 'success');
  },

  addSongToPlaylist(songId, playlistId) {
    DB.addToPlaylist(playlistId, songId);
    const pl = DB.getPlaylists().find(p => p.id === playlistId);
    this.toast(`✅ Added to "${pl?.name}"`, 'success');
  },

  deletePlaylistConfirm(id) {
    if (!confirm('Delete this playlist?')) return;
    DB.deletePlaylist(id);
    this._renderPlaylists();
    this.toast('🗑 Playlist deleted', 'info');
  },

  // ─── Admin ───
  _renderAdmin() {
    if (!DB.isAdminLoggedIn()) {
      this._renderAdminLogin();
    } else {
      this._renderAdminPanel();
    }
  },

  _renderAdminLogin() {
    document.getElementById('page-admin').innerHTML = `
      <div class="admin-login">
        <div class="admin-login-card">
          <h2>🔐 Admin Login</h2>
          <p>Enter your credentials to access the admin dashboard.</p>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input" id="adminUser" type="text" placeholder="admin" autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" id="adminPass" type="password" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="btn-submit" onclick="App.adminLogin()">Login</button>
          <p style="margin-top:16px;font-size:12px;color:var(--text-muted)">Demo: admin / gkmusic2024</p>
        </div>
      </div>
    `;
    document.getElementById('adminUser').addEventListener('keydown', e => e.key === 'Enter' && this.adminLogin());
    document.getElementById('adminPass').addEventListener('keydown', e => e.key === 'Enter' && this.adminLogin());
  },

  adminLogin() {
    const user = document.getElementById('adminUser')?.value;
    const pass = document.getElementById('adminPass')?.value;
    if (DB.adminLogin(user, pass)) {
      this._renderAdminPanel();
      this.toast('✅ Welcome, Admin!', 'success');
    } else {
      this.toast('❌ Invalid credentials', 'error');
    }
  },

  _renderAdminPanel() {
    const songs = DB.getAllSongs();
    const liked = DB.getLikedSongs();
    const playlists = DB.getPlaylists();
    const genres = [...new Set(songs.map(s => s.genre))];

    document.getElementById('page-admin').innerHTML = `
      <div class="admin-panel">
        <div class="admin-header">
          <h1>🎛 Admin Dashboard</h1>
          <button class="btn-logout" onclick="App.adminLogout()">Logout</button>
        </div>

        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-icon">🎵</div>
            <div class="stat-value">${songs.length}</div>
            <div class="stat-label">Total Songs</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❤️</div>
            <div class="stat-value">${liked.length}</div>
            <div class="stat-label">Liked Songs</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📂</div>
            <div class="stat-value">${playlists.length}</div>
            <div class="stat-label">Playlists</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎭</div>
            <div class="stat-value">${genres.length}</div>
            <div class="stat-label">Genres</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">▶</div>
            <div class="stat-value">${songs.reduce((a,s) => a + (s.plays||0), 0)}</div>
            <div class="stat-label">Total Plays</div>
          </div>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab active" onclick="App._switchAdminTab(this, 'upload')">Upload Song</button>
          <button class="admin-tab" onclick="App._switchAdminTab(this, 'manage')">Manage Songs</button>
        </div>

        <div id="adminTabUpload" class="admin-tab-content active">
          ${this._uploadFormHTML()}
        </div>
        <div id="adminTabManage" class="admin-tab-content">
          ${this._songsTableHTML(songs)}
        </div>
      </div>
    `;
    this._bindUploadForm();
  },

  _uploadFormHTML(song = null) {
    const isEdit = !!song;
    return `
      <div class="upload-form">
        <h3>${isEdit ? '✏️ Edit Song' : '⬆ Upload New Song'}</h3>
        <form id="uploadForm" onsubmit="App.handleUpload(event, ${song?.id || 'null'})">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Song Title *</label>
              <input class="form-input" id="fTitle" type="text" required
                     placeholder="Enter song title" value="${UI.esc(song?.title || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Artist Name *</label>
              <input class="form-input" id="fArtist" type="text" required
                     placeholder="Enter artist name" value="${UI.esc(song?.artist || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Album</label>
              <input class="form-input" id="fAlbum" type="text"
                     placeholder="Album name" value="${UI.esc(song?.album || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Genre *</label>
              <select class="form-input" id="fGenre" required>
                ${['Pop','Tamil','English','R&B','Hip-Hop','Classical','Jazz','Electronic','Rock','Folk'].map(g =>
                  `<option value="${g}" ${song?.genre === g ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Language *</label>
              <select class="form-input" id="fLanguage" required>
                ${['Tamil','English','Hindi','Telugu','Malayalam','Kannada'].map(l =>
                  `<option value="${l}" ${song?.language === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tags / Keywords</label>
              <input class="form-input" id="fTags" type="text"
                     placeholder="love, sad, night, dance (comma separated)"
                     value="${(song?.tags || []).join(', ')}">
            </div>
            <div class="form-group full">
              <label class="form-label">Album Cover Image</label>
              <div class="file-upload">
                <input type="file" id="fCover" accept="image/*" onchange="App._onFileChange(event,'coverName')">
                <div class="upload-icon">🖼</div>
                <div class="upload-text">Click or drag to upload album art</div>
                <div class="upload-hint">JPG, PNG, WebP — max 5MB</div>
                <div class="file-name" id="coverName">${song?.cover ? 'Current: ' + song.cover : ''}</div>
              </div>
            </div>
            <div class="form-group full">
              <label class="form-label">Audio File (MP3)</label>
              <div class="file-upload">
                <input type="file" id="fAudio" accept="audio/*" onchange="App._onFileChange(event,'audioName')">
                <div class="upload-icon">🎵</div>
                <div class="upload-text">Click or drag to upload audio</div>
                <div class="upload-hint">MP3, WAV, OGG — max 20MB</div>
                <div class="file-name" id="audioName">${song?.audio ? 'Current: ' + song.audio : ''}</div>
              </div>
            </div>
          </div>
          <button type="submit" class="btn-submit" style="max-width:200px;margin-top:8px">
            ${isEdit ? '💾 Save Changes' : '⬆ Upload Song'}
          </button>
          ${isEdit ? `<button type="button" class="topbar-btn outline" style="margin-left:12px;padding:13px 20px"
            onclick="App._renderAdminPanel()">Cancel</button>` : ''}
        </form>
      </div>
    `;
  },

  _songsTableHTML(songs) {
    return `
      <div style="overflow-x:auto">
        <table class="songs-table">
          <thead><tr>
            <th>Cover</th><th>Title</th><th>Artist</th>
            <th>Genre</th><th>Language</th><th>Plays</th><th>Date</th><th>Actions</th>
          </tr></thead>
          <tbody>${songs.map(s => UI.adminSongRow(s)).join('')}</tbody>
        </table>
      </div>
    `;
  },

  _switchAdminTab(btn, tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`adminTab${tab.charAt(0).toUpperCase()+tab.slice(1)}`).classList.add('active');
  },

  _bindUploadForm() {
    // handled via onsubmit attr
  },

  _onFileChange(e, labelId) {
    const f = e.target.files[0];
    const el = document.getElementById(labelId);
    if (el && f) el.textContent = `📎 ${f.name}`;
  },

  handleUpload(e, editId) {
    e.preventDefault();
    const title = document.getElementById('fTitle').value.trim();
    const artist = document.getElementById('fArtist').value.trim();
    const album = document.getElementById('fAlbum').value.trim();
    const genre = document.getElementById('fGenre').value;
    const language = document.getElementById('fLanguage').value;
    const tagsRaw = document.getElementById('fTags').value;
    const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    const coverFile = document.getElementById('fCover').files[0];
    const audioFile = document.getElementById('fAudio').files[0];

    // For demo: use object URLs or fallback covers
    const coverSrc = coverFile
      ? URL.createObjectURL(coverFile)
      : (editId ? DB.getSongById(editId)?.cover : `assets/covers/default${(DB.getAllSongs().length % 10) + 1}.svg`);
    const audioSrc = audioFile
      ? URL.createObjectURL(audioFile)
      : (editId ? DB.getSongById(editId)?.audio : 'assets/music/sample.mp3');

    if (editId) {
      DB.updateSong(editId, { title, artist, album, genre, language, tags, cover: coverSrc, audio: audioSrc });
      this.toast('✅ Song updated!', 'success');
    } else {
      const song = DB.addSong({ title, artist, album, genre, language, tags, cover: coverSrc, audio: audioSrc, duration: 0 });
      this.toast(`✅ "${title}" uploaded!`, 'success');
    }
    this._renderAdminPanel();
  },

  editSong(id) {
    const song = DB.getSongById(id);
    if (!song) return;
    document.getElementById('adminTabUpload').innerHTML = this._uploadFormHTML(song);
    this._switchAdminTab(document.querySelector('.admin-tab'), 'upload');
  },

  deleteSong(id) {
    const song = DB.getSongById(id);
    if (!song) return;
    if (!confirm(`Delete "${song.title}"?`)) return;
    DB.deleteSong(id);
    this.toast('🗑 Song deleted', 'info');
    this._renderAdminPanel();
  },

  adminLogout() {
    DB.adminLogout();
    this._renderAdminLogin();
    this.toast('👋 Logged out', 'info');
  },

  _bindAdminEvents() {
    // Bound via onclick attributes for simplicity
  },

  // ─── Player Methods ───
  playSong(id) {
    const song = DB.getSongById(id);
    if (!song) return;
    // Set queue to all current page songs or all songs
    const allSongs = DB.getAllSongs();
    const idx = allSongs.findIndex(s => s.id === id);
    this.player.setQueue(allSongs, idx);
    // Highlight in UI
    setTimeout(() => this.refreshPlayingUI(id), 50);
  },

  refreshPlayingUI(id) {
    document.querySelectorAll('.song-card, .song-row').forEach(el => {
      el.classList.toggle('playing', parseInt(el.dataset.id) === id);
    });
  },

  addToQueue(id) {
    const song = DB.getSongById(id);
    if (!song) return;
    this.player.queue.push(song);
    this.toast(`📋 "${song.title}" added to queue`, 'success');
  },

  toggleLike(event, id) {
    event.stopPropagation();
    this.toggleLikeById(id);
  },

  toggleLikeById(id) {
    const liked = DB.toggleLike(id);
    this.refreshLikeButtons(id, liked);
    this.toast(liked ? '❤️ Added to Liked Songs' : '💔 Removed from Liked', liked ? 'success' : 'info');
    if (this.currentPage === 'liked') this._renderLiked();
  },

  refreshLikeButtons(id, liked) {
    // Update all like buttons for this song
    document.querySelectorAll(`.song-card[data-id="${id}"] .song-card-like`).forEach(btn => {
      btn.classList.toggle('liked', liked);
      btn.textContent = liked ? '❤️' : '🤍';
    });
    document.querySelectorAll(`.song-row[data-id="${id}"] .song-row-action-btn:first-child`).forEach(btn => {
      btn.classList.toggle('liked', liked);
      btn.textContent = liked ? '❤️' : '🤍';
    });
  },

  shareGenre(genre) {
    this.navigateTo('search');
    setTimeout(() => {
      const chips = document.querySelectorAll('.filter-chips .chip');
      const chip = [...chips].find(c => c.textContent.trim() === genre);
      if (chip) this._filterChipClick(chip, `genre:${genre}`);
    }, 100);
  },

  // ─── Search ───
  _bindSearch() {
    const input = document.getElementById('mainSearch');
    const dropdown = document.getElementById('searchDropdown');
    const clearBtn = document.getElementById('searchClear');

    if (!input) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value;
      clearBtn.style.display = q ? 'block' : 'none';
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this._doSearch(q), 180);
    });

    input.addEventListener('focus', () => {
      if (input.value) dropdown.classList.add('visible');
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      dropdown.classList.remove('visible');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        dropdown.classList.remove('visible');
      }
    });
  },

  _doSearch(q) {
    const dropdown = document.getElementById('searchDropdown');
    if (!q || q.trim().length < 1) {
      dropdown.classList.remove('visible');
      return;
    }
    const results = SearchEngine.getSuggestions(q, DB.getAllSongs());
    if (results.length === 0) {
      dropdown.innerHTML = `<div class="search-dropdown-header">No results for "${UI.esc(q)}"</div>`;
    } else {
      dropdown.innerHTML = `
        <div class="search-dropdown-header">Results for "${UI.esc(q)}"</div>
        ${results.map(s => UI.searchResultItem(s)).join('')}
      `;
    }
    dropdown.classList.add('visible');
  },

  closeSearch() {
    const dropdown = document.getElementById('searchDropdown');
    const input = document.getElementById('mainSearch');
    if (dropdown) dropdown.classList.remove('visible');
    if (input) input.blur();
  },

  // ─── Context Menu ───
  openContextMenu(event, id) {
    event.preventDefault();
    event.stopPropagation();
    this.closeContextMenu();
    const song = DB.getSongById(id);
    if (!song) return;
    this.contextSongId = id;
    const x = Math.min(event.clientX, window.innerWidth - 200);
    const y = Math.min(event.clientY, window.innerHeight - 200);
    document.body.insertAdjacentHTML('beforeend', UI.contextMenu(song, x, y));
  },

  closeContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.remove();
  },

  // ─── Sidebar ───
  _renderSidebar() {
    const playlists = DB.getPlaylists();
    const plEl = document.getElementById('sidebarPlaylists');
    if (plEl) {
      plEl.innerHTML = playlists.map(pl => `
        <div class="sidebar-playlist-item" onclick="App.navigateTo('playlists'); setTimeout(()=>App.openPlaylist(${pl.id}),100)">
          🎵 ${UI.esc(pl.name)}
        </div>
      `).join('') || '<div style="padding:8px 12px;font-size:12px;color:var(--text-muted)">No playlists yet</div>';
    }
  },

  // ─── Player Bar ───
  _renderPlayer() {
    // Player HTML is in index.html, this just ensures state is correct
  },

  // ─── Navigation Binding ───
  _bindNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => this.navigateTo(el.dataset.page));
    });
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (menuToggle) menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    if (overlay) overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
    // Close context menu on outside click
    document.addEventListener('click', () => this.closeContextMenu());
  },

  // ─── Toast ───
  toast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// ─── Boot ───
document.addEventListener('DOMContentLoaded', () => App.init());
