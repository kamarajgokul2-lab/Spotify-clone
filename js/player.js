// ==========================================
// GK MUSIC — Music Player
// Full-featured audio player with all controls
// ==========================================

class Player {
  constructor() {
    this.audio = new Audio();
    this.currentSong = null;
    this.queue = [];
    this.queueIndex = -1;
    this.shuffle = false;
    this.repeat = 'none'; // none | one | all
    this.volume = 0.7;
    this._shuffledQueue = [];
    this._initAudio();
    this._bindUI();
  }

  _initAudio() {
    this.audio.volume = this.volume;
    this.audio.addEventListener('timeupdate', () => this._onTimeUpdate());
    this.audio.addEventListener('ended', () => this._onEnded());
    this.audio.addEventListener('loadedmetadata', () => this._onLoaded());
    this.audio.addEventListener('play', () => this._onPlayState(true));
    this.audio.addEventListener('pause', () => this._onPlayState(false));
    this.audio.addEventListener('error', () => this._onError());
  }

  _bindUI() {
    // Main player controls
    this._q = (sel) => document.querySelector(sel);
    this._qa = (sel) => document.querySelectorAll(sel);

    const bind = (sel, event, fn) => {
      const el = this._q(sel);
      if (el) el.addEventListener(event, fn.bind(this));
    };

    bind('#playBtn', 'click', this.togglePlay);
    bind('#prevBtn', 'click', this.prev);
    bind('#nextBtn', 'click', this.next);
    bind('#shuffleBtn', 'click', this.toggleShuffle);
    bind('#repeatBtn', 'click', this.toggleRepeat);
    bind('#progressTrack', 'click', this._seekClick);
    bind('#volumeSlider', 'input', this._volumeChange);
    bind('#volumeBtn', 'click', this._toggleMute);
    bind('#fullscreenBtn', 'click', () => this._openFullscreen());
    bind('#fsClose', 'click', () => this._closeFullscreen());
    bind('#fsPlayBtn', 'click', this.togglePlay);
    bind('#fsPrevBtn', 'click', this.prev);
    bind('#fsNextBtn', 'click', this.next);
    bind('#fsShuffleBtn', 'click', this.toggleShuffle);
    bind('#fsRepeatBtn', 'click', this.toggleRepeat);
    bind('#fsProgressTrack', 'click', this._seekClick);
    bind('#fsVolumeSlider', 'input', this._volumeChange);
    bind('#playerLikeBtn', 'click', this._toggleLike);
    bind('#playerCover', 'click', () => this._openFullscreen());

    // Volume slider initial
    const vSlider = this._q('#volumeSlider');
    if (vSlider) vSlider.value = this.volume * 100;
    const fsVSlider = this._q('#fsVolumeSlider');
    if (fsVSlider) fsVSlider.value = this.volume * 100;

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
      if (e.code === 'ArrowRight') this.next();
      if (e.code === 'ArrowLeft') this.prev();
      if (e.code === 'ArrowUp') { this.setVolume(Math.min(1, this.volume + 0.1)); }
      if (e.code === 'ArrowDown') { this.setVolume(Math.max(0, this.volume - 0.1)); }
      if (e.code === 'KeyF') this._openFullscreen();
      if (e.code === 'Escape') this._closeFullscreen();
    });
  }

  // ─── Load & Play ───
  load(song, autoplay = true) {
    if (!song) return;
    this.currentSong = song;
    this.audio.src = song.audio;
    this.audio.load();
    this._updateUI();
    DB.addToRecent(song.id);
    DB.incrementPlay(song.id);
    if (autoplay) {
      this.audio.play().catch(() => {
        // Autoplay blocked, update UI anyway
        this._onPlayState(false);
      });
    }
    // Update page song cards highlighting
    document.querySelectorAll('.song-card, .song-row').forEach(el => {
      el.classList.toggle('playing', parseInt(el.dataset.id) === song.id);
    });
  }

  setQueue(songs, startIndex = 0) {
    this.queue = [...songs];
    this.queueIndex = startIndex;
    this._buildShuffledQueue();
    this.load(songs[startIndex]);
  }

  _buildShuffledQueue() {
    this._shuffledQueue = [...this.queue];
    for (let i = this._shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._shuffledQueue[i], this._shuffledQueue[j]] = [this._shuffledQueue[j], this._shuffledQueue[i]];
    }
  }

  // ─── Controls ───
  togglePlay() {
    if (!this.currentSong) return;
    if (this.audio.paused) this.audio.play();
    else this.audio.pause();
  }

  next() {
    const q = this.shuffle ? this._shuffledQueue : this.queue;
    if (!q.length) return;
    let idx = q.findIndex(s => s.id === this.currentSong?.id);
    idx = (idx + 1) % q.length;
    this.queueIndex = idx;
    this.load(q[idx]);
  }

  prev() {
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
    const q = this.shuffle ? this._shuffledQueue : this.queue;
    if (!q.length) return;
    let idx = q.findIndex(s => s.id === this.currentSong?.id);
    idx = (idx - 1 + q.length) % q.length;
    this.queueIndex = idx;
    this.load(q[idx]);
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle) this._buildShuffledQueue();
    const btn = this._q('#shuffleBtn');
    const fsBtn = this._q('#fsShuffleBtn');
    if (btn) btn.classList.toggle('active', this.shuffle);
    if (fsBtn) fsBtn.classList.toggle('active', this.shuffle);
    App.toast(this.shuffle ? '🔀 Shuffle on' : '🔀 Shuffle off', 'info');
  }

  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    this.repeat = modes[(modes.indexOf(this.repeat) + 1) % modes.length];
    this._updateRepeatUI();
    const labels = { none: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
    App.toast(`🔁 ${labels[this.repeat]}`, 'info');
  }

  _updateRepeatUI() {
    const btn = this._q('#repeatBtn');
    const fsBtn = this._q('#fsRepeatBtn');
    const icons = { none: '🔁', all: '🔁', one: '🔂' };
    const icon = icons[this.repeat] || '🔁';
    if (btn) {
      btn.classList.toggle('active', this.repeat !== 'none');
      btn.textContent = icon;
    }
    if (fsBtn) {
      fsBtn.classList.toggle('active', this.repeat !== 'none');
      fsBtn.textContent = icon;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
    const vSlider = this._q('#volumeSlider');
    const fsVSlider = this._q('#fsVolumeSlider');
    if (vSlider) vSlider.value = this.volume * 100;
    if (fsVSlider) fsVSlider.value = this.volume * 100;
    this._updateVolumeIcon();
  }

  _volumeChange(e) {
    this.setVolume(e.target.value / 100);
    // Sync sibling slider
    const isFs = e.target.id === 'fsVolumeSlider';
    const other = this._q(isFs ? '#volumeSlider' : '#fsVolumeSlider');
    if (other) other.value = e.target.value;
  }

  _toggleMute() {
    if (this.audio.volume > 0) {
      this._prevVolume = this.audio.volume;
      this.setVolume(0);
    } else {
      this.setVolume(this._prevVolume || 0.7);
    }
  }

  _updateVolumeIcon() {
    const btn = this._q('#volumeBtn');
    if (!btn) return;
    if (this.volume === 0) btn.textContent = '🔇';
    else if (this.volume < 0.4) btn.textContent = '🔈';
    else if (this.volume < 0.7) btn.textContent = '🔉';
    else btn.textContent = '🔊';
  }

  _seekClick(e) {
    if (!this.currentSong) return;
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = pct * (this.audio.duration || 0);
  }

  _toggleLike() {
    if (!this.currentSong) return;
    const liked = DB.toggleLike(this.currentSong.id);
    const btn = this._q('#playerLikeBtn');
    if (btn) {
      btn.classList.toggle('liked', liked);
      btn.textContent = liked ? '❤️' : '🤍';
    }
    App.toast(liked ? '❤️ Added to Liked Songs' : '💔 Removed from Liked Songs', liked ? 'success' : 'info');
    App.refreshLikeButtons(this.currentSong.id, liked);
  }

  // ─── Audio Events ───
  _onTimeUpdate() {
    if (!this.audio.duration) return;
    const pct = (this.audio.currentTime / this.audio.duration) * 100;
    const fills = document.querySelectorAll('.progress-fill');
    fills.forEach(f => f.style.width = pct + '%');
    const curLabels = document.querySelectorAll('.time-current');
    curLabels.forEach(l => l.textContent = this._fmt(this.audio.currentTime));
  }

  _onLoaded() {
    const durLabels = document.querySelectorAll('.time-total');
    durLabels.forEach(l => l.textContent = this._fmt(this.audio.duration));
  }

  _onEnded() {
    if (this.repeat === 'one') { this.audio.currentTime = 0; this.audio.play(); return; }
    if (this.repeat === 'all' || this.queue.length > 1) this.next();
    else this._onPlayState(false);
  }

  _onPlayState(playing) {
    const playBtns = document.querySelectorAll('#playBtn, #fsPlayBtn');
    playBtns.forEach(btn => btn.textContent = playing ? '⏸' : '▶');
    const cover = this._q('#playerCoverImg');
    const fsCover = this._q('#fsArt');
    if (cover) cover.parentElement.classList.toggle('spinning', playing);
    if (fsCover) fsCover.classList.toggle('spinning', playing);
  }

  _onError() {
    // Silently handle — demo mode with no real audio files
    this._onPlayState(false);
  }

  // ─── UI Update ───
  _updateUI() {
    if (!this.currentSong) return;
    const song = this.currentSong;

    // Cover images
    document.querySelectorAll('.player-cover-img').forEach(img => img.src = song.cover);
    const fsCoverImg = this._q('#fsArtImg');
    if (fsCoverImg) fsCoverImg.src = song.cover;

    // Titles
    const titleEls = document.querySelectorAll('.player-title');
    titleEls.forEach(el => el.textContent = song.title);
    const artistEls = document.querySelectorAll('.player-artist');
    artistEls.forEach(el => el.textContent = song.artist);

    const fsTitle = this._q('#fsTitle');
    const fsArtist = this._q('#fsArtist');
    if (fsTitle) fsTitle.textContent = song.title;
    if (fsArtist) fsArtist.textContent = song.artist;

    // Like button
    const liked = DB.isLiked(song.id);
    const likeBtn = this._q('#playerLikeBtn');
    if (likeBtn) {
      likeBtn.classList.toggle('liked', liked);
      likeBtn.textContent = liked ? '❤️' : '🤍';
    }

    // Reset progress
    const fills = document.querySelectorAll('.progress-fill');
    fills.forEach(f => f.style.width = '0%');
    document.querySelectorAll('.time-current').forEach(l => l.textContent = '0:00');
    document.querySelectorAll('.time-total').forEach(l => l.textContent = this._fmt(song.duration || 0));

    document.title = `${song.title} — GK Music`;
  }

  _openFullscreen() {
    const fs = this._q('#fullscreenPlayer');
    if (fs) fs.classList.add('open');
  }

  _closeFullscreen() {
    const fs = this._q('#fullscreenPlayer');
    if (fs) fs.classList.remove('open');
  }

  _fmt(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  isPlaying() { return !this.audio.paused; }
}
