// ==========================================
// GK MUSIC — Smart Search Engine
// Fuzzy, prefix, keyword, multi-field search
// ==========================================

class SearchEngine {
  // Main search function — returns scored, sorted results
  static search(query, songs, limit = 8) {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/);

    const scored = songs.map(song => {
      let score = 0;
      let matchType = '';

      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      const genre = song.genre.toLowerCase();
      const tags = (song.tags || []).map(t => t.toLowerCase());
      const album = (song.album || '').toLowerCase();
      const language = (song.language || '').toLowerCase();

      // ─── Exact full match ───
      if (title === q) { score += 100; matchType = 'title'; }
      if (artist === q) { score += 90; matchType = matchType || 'artist'; }

      // ─── Prefix match ───
      if (title.startsWith(q)) { score += 80; matchType = matchType || 'title'; }
      if (artist.startsWith(q)) { score += 70; matchType = matchType || 'artist'; }
      if (genre.startsWith(q)) { score += 50; matchType = matchType || 'genre'; }

      // ─── Contains match ───
      if (title.includes(q)) { score += 60; matchType = matchType || 'title'; }
      if (artist.includes(q)) { score += 50; matchType = matchType || 'artist'; }
      if (album.includes(q)) { score += 30; matchType = matchType || 'album'; }
      if (genre.includes(q)) { score += 35; matchType = matchType || 'genre'; }
      if (language.includes(q)) { score += 25; matchType = matchType || 'language'; }

      // ─── Tag matching ───
      for (const tag of tags) {
        if (tag === q) { score += 55; matchType = matchType || 'tag'; }
        else if (tag.startsWith(q)) { score += 40; matchType = matchType || 'tag'; }
        else if (tag.includes(q)) { score += 25; matchType = matchType || 'tag'; }
      }

      // ─── Multi-term matching (handles "leave me alone" → "leave", "me", "alone") ───
      if (terms.length > 1) {
        let termScore = 0;
        for (const term of terms) {
          if (term.length < 2) continue;
          if (title.includes(term)) termScore += 15;
          if (artist.includes(term)) termScore += 12;
          if (tags.some(t => t.includes(term))) termScore += 10;
          if (genre.includes(term)) termScore += 8;
        }
        // Bonus if all terms match
        const allMatch = terms.every(term =>
          title.includes(term) || artist.includes(term) ||
          tags.some(t => t.includes(term)) || genre.includes(term)
        );
        if (allMatch) termScore *= 1.5;
        score += termScore;
        if (termScore > 0 && !matchType) matchType = 'keywords';
      }

      // ─── Fuzzy matching for typos ───
      if (score === 0) {
        const fuzzyScore = this._fuzzy(q, title) * 40 +
                           this._fuzzy(q, artist) * 30 +
                           Math.max(...tags.map(t => this._fuzzy(q, t))) * 20;
        if (fuzzyScore > 15) {
          score += fuzzyScore;
          matchType = matchType || 'fuzzy';
        }
      }

      // Popularity boost (small)
      if (score > 0) score += Math.log(1 + (song.plays || 0)) * 0.5;

      return { song, score, matchType };
    });

    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => ({ ...r.song, _matchType: r.matchType }));
  }

  // Levenshtein-based similarity 0–1
  static _fuzzy(a, b) {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    const dist = this._levenshtein(a, b);
    return Math.max(0, 1 - dist / maxLen);
  }

  static _levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1];
        else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  // Generate search suggestions (deduplicated, typed)
  static getSuggestions(query, songs) {
    const results = this.search(query, songs, 8);
    return results;
  }

  // Get match type label
  static getMatchLabel(matchType) {
    const labels = {
      title: 'Title', artist: 'Artist', genre: 'Genre',
      tag: 'Tag', album: 'Album', keywords: 'Keywords',
      fuzzy: 'Close Match', language: 'Language'
    };
    return labels[matchType] || 'Match';
  }
}
