/**
 * SPOTIFY CLONE - APP CONTROLLER
 * High-fidelity client-side audio player with dynamic routing,
 * custom playlist management, search, and Web Audio API visualizer.
 */

// ==========================================================================
// 1. DATA DEFINITIONS (Sai Abhyankkar Indie Catalog)
// ==========================================================================

const SONGS_DB = {
  "aasa_kooda": {
    id: "aasa_kooda",
    title: "Aasa Kooda",
    artist: "Sai Abhyankkar, Sai Smriti",
    album: "Think Indie Essentials",
    year: 2024,
    duration: 215, // 3:35
    src: "https://res.cloudinary.com/djvqpkhdx/video/upload/q_auto/f_auto/v1782029511/Aasa_Kooda_vi4ooy.mp3",
    cover: "assets/images/aasa_kooda.png",
    themeColor: "#1d5837", // Forest green
    bio: "Released in 2024, 'Aasa Kooda' is a romantic independent Tamil track composed and produced by Sai Abhyankkar. The song features vocals by Sai Abhyankkar and Sai Smriti, with lyrics by Sathyan Ilanko. It captures the essence of youthful romance with a blend of acoustic guitars, modern beats, and rich vocals, becoming an instant chartbuster."
  },
  "katchi_sera": {
    id: "katchi_sera",
    title: "Katchi Sera",
    artist: "Sai Abhyankkar",
    album: "Think Indie Essentials",
    year: 2024,
    duration: 184, // 3:04
    src: "https://res.cloudinary.com/djvqpkhdx/video/upload/q_auto/f_auto/v1782029511/Katchi_Sera_loqzw6.mp3",
    cover: "assets/images/katchi_sera.png",
    themeColor: "#8c1c3f", // Crimson
    bio: "'Katchi Sera' is the sensational debut single of Sai Abhyankkar under Think Indie. The track features additional vocals by Sai Smriti and lyrics by Adesh Krishna. Combining traditional instruments like Nadaswaram and Tavil with electric guitar, acoustic bass, and snappy live percussions, the track became a global viral sensation on social media."
  },
  "pavazha_malli": {
    id: "pavazha_malli",
    title: "Pavazha Malli",
    artist: "Sai Abhyankkar, Shruti Haasan",
    album: "Think Indie Essentials",
    year: 2026,
    duration: 260, // 4:20
    src: "https://res.cloudinary.com/djvqpkhdx/video/upload/q_auto/f_auto/v1782029512/Pavazha_Malli_uiov0c.mp3",
    cover: "assets/images/pavazha_malli.png",
    themeColor: "#b27318", // Amber/Gold
    bio: "'Pavazha Malli' (Coral Jasmine) is a grand celebration of love composed by Sai Abhyankkar. Featuring the soulful vocals of multi-talented artist Shruti Haasan along with Sai Abhyankkar, this 2026 release blends traditional acoustic and folk instrumentation (Nadaswaram, Tavil) with global rhythms, narrating a sweet courtship theme."
  },
  "sithira_puthiri": {
    id: "sithira_puthiri",
    title: "Sithira Puthiri",
    artist: "Sai Abhyankkar",
    album: "Think Indie Essentials",
    year: 2025,
    duration: 226, // 3:46
    src: "https://res.cloudinary.com/djvqpkhdx/video/upload/q_auto/f_auto/v1782029512/Sithira-Puthiri-MassTamilan.dev_l8uqaa.mp3",
    cover: "assets/images/sithira_puthiri.png",
    themeColor: "#1d4787", // Ocean Blue
    bio: "'Sithira Puthiri' is a mesmerizing Tamil ballad released in January 2025. Compose and performed by Sai Abhyankkar, the song features Vivek's poetry along with backing vocals by Gana Muthu and Rumi. Structurally ambitious, it synthesizes global rhythmic structures with high-energy ethnic arrangements, creating a danceable pop riddle."
  }
};

// Default featured playlists
const DEFAULT_PLAYLISTS = {
  "sai-hits": {
    id: "sai-hits",
    title: "Sai Abhyankkar Hits",
    description: "All the massive viral sensations by Sai Abhyankkar in one place.",
    cover: "assets/images/pavazha_malli.png",
    songs: ["pavazha_malli", "aasa_kooda", "katchi_sera", "sithira_puthiri"],
    themeColor: "#702b8a", // Purple
    isEditable: false
  },
  "think-indie": {
    id: "think-indie",
    title: "Think Indie Essentials",
    description: "Catch up on the finest independent Tamil music collective.",
    cover: "assets/images/aasa_kooda.png",
    songs: ["aasa_kooda", "katchi_sera"],
    themeColor: "#1b634b", // Emerald
    isEditable: false
  },
  "chill-hits": {
    id: "chill-hits",
    title: "Vibe Session",
    description: "Sit back and enjoy the best contemporary production.",
    cover: "assets/images/sithira_puthiri.png",
    songs: ["sithira_puthiri", "aasa_kooda"],
    themeColor: "#214282", // Indigo
    isEditable: false
  }
};

// ==========================================================================
// 2. STATE MANAGER
// ==========================================================================

const state = {
  // Navigation Routing
  currentPage: "home",
  activePlaylistId: null,
  historyStack: ["home"],
  historyIndex: 0,
  
  // Library Storage
  customPlaylists: {},
  likedTracks: [],
  
  // Audio playback state
  currentPlaylistId: "sai-hits",
  currentTrackList: ["pavazha_malli", "aasa_kooda", "katchi_sera", "sithira_puthiri"],
  currentTrackIndex: 0,
  isPlaying: false,
  shuffle: false,
  repeatMode: "all", // "none", "all", "one"
  volume: 0.8,
  isMuted: false,
  queue: []
};

// Native HTML5 Audio Elements
const audio = new Audio();
audio.preload = "auto";
// Enable crossOrigin to avoid visualizer canvas taint issues
audio.crossOrigin = "anonymous";

const statusBanner = document.getElementById("app-status-banner");

function showStatus(message, isError = false) {
  if (!statusBanner) return;
  statusBanner.textContent = message;
  statusBanner.classList.remove("show", "error");
  if (isError) {
    statusBanner.classList.add("error");
  }
  statusBanner.classList.add("show");
  clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = setTimeout(() => {
    statusBanner.classList.remove("show", "error");
  }, 2600);
}

// Web Audio API Visualizer elements
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let animationFrameId = null;
let visualizerEnabled = true;

// ==========================================================================
// 3. INITIALIZATION & RECOVERY (LOCALSTORAGE)
// ==========================================================================

function initApp() {
  loadFromLocalStorage();
  setupEventListeners();
  updateGreetingText();
  renderSidebarPlaylists();
  renderHomeShelf();
  
  // Load initial track (do not auto-play immediately to comply with browser gestures)
  loadTrack("pavazha_malli", "sai-hits", false);
  
  // Update state displays
  updateLikedSongsCounts();
  syncVolumeUI();
  
  // Sync router navigation
  navigateTo("home");
  showStatus("Ready to play your music");
  
  // Check timeline changes
  setInterval(updateGreetingText, 60000); // refresh greeting every minute
}

function loadFromLocalStorage() {
  try {
    const savedLikes = localStorage.getItem("spotify_liked_songs");
    if (savedLikes) {
      state.likedTracks = JSON.parse(savedLikes);
    } else {
      // Pre-like Aasa Kooda just to populate something
      state.likedTracks = ["aasa_kooda"];
    }
    
    const savedPlaylists = localStorage.getItem("spotify_custom_playlists");
    if (savedPlaylists) {
      state.customPlaylists = JSON.parse(savedPlaylists);
    }
    
    const savedVolume = localStorage.getItem("spotify_volume");
    if (savedVolume) {
      state.volume = parseFloat(savedVolume);
      audio.volume = state.volume;
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem("spotify_liked_songs", JSON.stringify(state.likedTracks));
    localStorage.setItem("spotify_custom_playlists", JSON.stringify(state.customPlaylists));
    localStorage.setItem("spotify_volume", state.volume.toString());
  } catch (e) {
    console.error("Error writing localStorage:", e);
  }
}

// ==========================================================================
// 4. ROUTER / VIEW CONTROLLER
// ==========================================================================

function navigateTo(pageId, playlistId = null) {
  // Close any modal open state
  closePlaylistModal();
  
  // Update router page states
  state.currentPage = pageId;
  state.activePlaylistId = playlistId;
  
  // Push to history if we are not traversing backward/forward
  const currentStackTop = state.historyStack[state.historyIndex];
  const targetStateStr = playlistId ? `${pageId}:${playlistId}` : pageId;
  const currentStackTopStr = currentStackTop;
  
  if (targetStateStr !== currentStackTopStr) {
    // Truncate history stack if we were in the middle of navigating back
    state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    state.historyStack.push(targetStateStr);
    state.historyIndex = state.historyStack.length - 1;
  }
  
  // Sync active states on sidebar navigation items
  document.querySelectorAll(".sidebar .nav-link, .sidebar .library-item").forEach(el => {
    el.classList.remove("active");
  });
  
  if (pageId === "home") {
    document.querySelector('.sidebar button[data-page="home"]')?.classList.add("active");
  } else if (pageId === "search") {
    document.querySelector('.sidebar button[data-page="search"]')?.classList.add("active");
  } else if (pageId === "liked-songs") {
    document.querySelector('.sidebar div[data-page="liked-songs"]')?.classList.add("active");
  } else if (pageId === "playlist" && playlistId) {
    const sidebarItem = document.querySelector(`.sidebar div[data-playlist-id="${playlistId}"]`);
    if (sidebarItem) sidebarItem.classList.add("active");
  }
  
  // Toggle Search bar visibility in Header
  const searchBar = document.getElementById("header-search-bar");
  if (pageId === "search") {
    searchBar.style.display = "flex";
    document.getElementById("search-input").focus();
  } else {
    searchBar.style.display = "none";
  }
  
  // Swap viewport panels
  document.querySelectorAll(".view-viewport .content-view").forEach(el => {
    el.classList.remove("active");
  });
  
  const activeViewDOM = document.getElementById(`view-${pageId}`);
  if (activeViewDOM) {
    activeViewDOM.classList.add("active");
    // Scroll viewport to top
    const scrollContent = activeViewDOM.querySelector(".view-scroll-content") || activeViewDOM;
    scrollContent.scrollTop = 0;
  }
  
  // Custom render operations based on target page
  if (pageId === "playlist" && playlistId) {
    renderPlaylistDetail(playlistId);
  } else if (pageId === "liked-songs") {
    renderLikedSongsDetail();
  } else if (pageId === "queue") {
    renderQueueDetail();
  } else if (pageId === "search") {
    runSearch();
  }
  
  updateHeaderScrolledState();
}

function handleHistoryBack() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    loadHistoryState(state.historyStack[state.historyIndex]);
  }
}

function handleHistoryForward() {
  if (state.historyIndex < state.historyStack.length - 1) {
    state.historyIndex++;
    loadHistoryState(state.historyStack[state.historyIndex]);
  }
}

function loadHistoryState(stateStr) {
  const parts = stateStr.split(":");
  const pageId = parts[0];
  const playlistId = parts[1] || null;
  
  // Navigate directly without pushing new history item
  state.currentPage = pageId;
  state.activePlaylistId = playlistId;
  
  // Sync active states on sidebar navigation items
  document.querySelectorAll(".sidebar .nav-link, .sidebar .library-item").forEach(el => {
    el.classList.remove("active");
  });
  if (pageId === "home") {
    document.querySelector('.sidebar button[data-page="home"]')?.classList.add("active");
  } else if (pageId === "search") {
    document.querySelector('.sidebar button[data-page="search"]')?.classList.add("active");
  } else if (pageId === "liked-songs") {
    document.querySelector('.sidebar div[data-page="liked-songs"]')?.classList.add("active");
  } else if (pageId === "playlist" && playlistId) {
    const sidebarItem = document.querySelector(`.sidebar div[data-playlist-id="${playlistId}"]`);
    if (sidebarItem) sidebarItem.classList.add("active");
  }
  
  const searchBar = document.getElementById("header-search-bar");
  if (pageId === "search") {
    searchBar.style.display = "flex";
  } else {
    searchBar.style.display = "none";
  }
  
  document.querySelectorAll(".view-viewport .content-view").forEach(el => {
    el.classList.remove("active");
  });
  
  const activeViewDOM = document.getElementById(`view-${pageId}`);
  if (activeViewDOM) {
    activeViewDOM.classList.add("active");
  }
  
  if (pageId === "playlist" && playlistId) {
    renderPlaylistDetail(playlistId);
  } else if (pageId === "liked-songs") {
    renderLikedSongsDetail();
  } else if (pageId === "queue") {
    renderQueueDetail();
  }
}

function updateGreetingText() {
  const hr = new Date().getHours();
  let greet = "Good evening";
  if (hr >= 5 && hr < 12) {
    greet = "Good morning";
  } else if (hr >= 12 && hr < 17) {
    greet = "Good afternoon";
  }
  document.getElementById("greeting-text").textContent = greet;
}

// ==========================================================================
// 5. PLAYBACK CORE ENGINE
// ==========================================================================

function loadTrack(trackId, playlistId = null, shouldPlay = true) {
  const song = SONGS_DB[trackId];
  if (!song) {
    showStatus("Track not found.", true);
    return;
  }
  
  // Set current song index in active list
  if (playlistId) {
    state.currentPlaylistId = playlistId;
    state.currentTrackList = getPlaylistSongs(playlistId);
    state.currentTrackIndex = state.currentTrackList.indexOf(trackId);
  }
  
  // Set source
  audio.src = song.src;
  
  // Update bottom play control details
  document.getElementById("player-cover").src = song.cover;
  document.getElementById("player-title").textContent = song.title;
  document.getElementById("player-artist").textContent = song.artist;
  document.getElementById("time-total").textContent = formatTime(song.duration);
  document.getElementById("progress-slider").max = song.duration;
  document.getElementById("progress-slider").value = 0;
  document.getElementById("progress-fill").style.width = "0%";
  
  // Update Right Panel detail cards
  document.getElementById("right-panel-cover").src = song.cover;
  document.getElementById("right-panel-title").textContent = song.title;
  document.getElementById("right-panel-artist").textContent = song.artist;
  document.getElementById("right-panel-artist-bg").style.backgroundImage = `url('${song.cover}')`;
  document.getElementById("right-panel-artist-about-name").textContent = song.artist.split(",")[0];
  document.getElementById("right-panel-artist-bio").textContent = song.bio;
  
  // Dynamic extraction colors
  setPlaylistViewBannerColor(song.themeColor);
  
  // Sync favorite state
  const heartIcons = [
    document.getElementById("player-heart-btn"),
    document.getElementById("right-panel-heart-btn")
  ];
  const isLiked = state.likedTracks.includes(trackId);
  heartIcons.forEach(btn => {
    if (isLiked) {
      btn.classList.add("liked");
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    } else {
      btn.classList.remove("liked");
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-outline"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    }
  });
  
  // Sync global highlighting active track rows
  document.querySelectorAll("tr[data-song-id], div[data-song-id]").forEach(el => {
    if (el.getAttribute("data-song-id") === trackId) {
      el.classList.add("active-song", "active");
    } else {
      el.classList.remove("active-song", "active");
    }
  });
  
  if (shouldPlay) {
    playTrack();
  } else {
    pauseTrack();
  }
}

function playTrack() {
  // Initialize Web Audio API on first interaction
  initAudioContext();
  
  audio.play()
    .then(() => {
      state.isPlaying = true;
      document.getElementById("play-pause-btn").innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      document.getElementById("play-pause-btn").title = "Pause";
      
      // Update visualizer canvas animating bars
      if (visualizerEnabled) startVisualizerAnimation();
      
      // Sync playlist views play icons
      document.querySelectorAll(".playlist-play-giant-btn, .card-play-btn, .quick-play-btn").forEach(btn => {
        // Toggle play icon to pause if it relates to current playlist
        const pId = btn.getAttribute("data-playlist") || btn.closest("[data-playlist-id]")?.getAttribute("data-playlist-id") || state.currentPlaylistId;
        if (pId === state.currentPlaylistId) {
          btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        }
      });
    })
    .catch(err => {
      console.warn("Audio playback failed due to gesture constraints:", err);
      pauseTrack();
      showStatus("Playback blocked until you click play again.", true);
    });
}

function pauseTrack() {
  audio.pause();
  state.isPlaying = false;
  document.getElementById("play-pause-btn").innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  document.getElementById("play-pause-btn").title = "Play";
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Sync lists play icons
  document.querySelectorAll(".playlist-play-giant-btn, .card-play-btn, .quick-play-btn").forEach(btn => {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  });
}

function togglePlay() {
  if (state.isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function nextTrack() {
  // 1. Check if queue has songs
  if (state.queue.length > 0) {
    const nextQueueTrack = state.queue.shift();
    loadTrack(nextQueueTrack, null, true);
    renderQueueDetail(); // update queue UI
    return;
  }
  
  // 2. Play next in active playlist
  if (state.currentTrackList.length === 0) return;
  
  if (state.shuffle) {
    // Select random index
    const randomIndex = Math.floor(Math.random() * state.currentTrackList.length);
    state.currentTrackIndex = randomIndex;
  } else {
    state.currentTrackIndex = (state.currentTrackIndex + 1) % state.currentTrackList.length;
  }
  
  const nextTrackId = state.currentTrackList[state.currentTrackIndex];
  loadTrack(nextTrackId, state.currentPlaylistId, true);
}

function prevTrack() {
  if (state.currentTrackList.length === 0) return;
  
  // If track has been playing for more than 3 seconds, restart it
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  
  if (state.shuffle) {
    const randomIndex = Math.floor(Math.random() * state.currentTrackList.length);
    state.currentTrackIndex = randomIndex;
  } else {
    state.currentTrackIndex = (state.currentTrackIndex - 1 + state.currentTrackList.length) % state.currentTrackList.length;
  }
  
  const prevTrackId = state.currentTrackList[state.currentTrackIndex];
  loadTrack(prevTrackId, state.currentPlaylistId, true);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  const btn = document.getElementById("shuffle-btn");
  if (state.shuffle) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }
}

function toggleRepeat() {
  const btn = document.getElementById("repeat-btn");
  const badge = btn.querySelector(".repeat-one-indicator");
  
  if (state.repeatMode === "all") {
    state.repeatMode = "one";
    btn.classList.add("active");
    badge.classList.remove("hidden");
    btn.title = "Repeat one";
  } else if (state.repeatMode === "one") {
    state.repeatMode = "none";
    btn.classList.remove("active");
    badge.classList.add("hidden");
    btn.title = "Enable repeat";
  } else {
    state.repeatMode = "all";
    btn.classList.add("active");
    badge.classList.add("hidden");
    btn.title = "Repeat all";
  }
}

function handleTrackEnded() {
  if (state.repeatMode === "one") {
    audio.currentTime = 0;
    playTrack();
  } else if (state.repeatMode === "all") {
    nextTrack();
  } else {
    // Repeat off: stop if last song in list
    if (state.currentTrackIndex === state.currentTrackList.length - 1 && state.queue.length === 0) {
      pauseTrack();
      audio.currentTime = 0;
    } else {
      nextTrack();
    }
  }
}

// Progress Timeline update
audio.addEventListener("timeupdate", () => {
  if (isNaN(audio.duration)) return;
  
  const curTime = Math.floor(audio.currentTime);
  document.getElementById("time-current").textContent = formatTime(curTime);
  
  // Move scrubber
  const slider = document.getElementById("progress-slider");
  slider.value = curTime;
  
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById("progress-fill").style.width = `${pct}%`;
});

audio.addEventListener("ended", handleTrackEnded);
audio.addEventListener("error", () => {
  showStatus("Audio could not be loaded right now.", true);
  pauseTrack();
});

// Metadata loading handles dynamic durations if not set statically
audio.addEventListener("loadedmetadata", () => {
  document.getElementById("time-total").textContent = formatTime(Math.floor(audio.duration));
  document.getElementById("progress-slider").max = Math.floor(audio.duration);
});

// Seek timeline
document.getElementById("progress-slider").addEventListener("input", (e) => {
  const seekVal = parseFloat(e.target.value);
  audio.currentTime = seekVal;
  const pct = (seekVal / audio.duration) * 100;
  document.getElementById("progress-fill").style.width = `${pct}%`;
});

// Volume settings
function setVolume(val) {
  state.volume = val;
  audio.volume = val;
  state.isMuted = (val === 0);
  syncVolumeUI();
  saveToLocalStorage();
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.muted = state.isMuted;
  syncVolumeUI();
}

function syncVolumeUI() {
  const volBtn = document.getElementById("volume-mute-btn");
  const slider = document.getElementById("volume-slider");
  const fill = document.getElementById("volume-fill");
  
  const currentVolPct = state.isMuted ? 0 : Math.round(state.volume * 100);
  slider.value = currentVolPct;
  fill.style.width = `${currentVolPct}%`;
  
  // Icon selector
  if (state.isMuted || state.volume === 0) {
    volBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="vol-icon-mute"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
    volBtn.title = "Unmute";
  } else if (state.volume < 0.5) {
    volBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="vol-icon-low"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    volBtn.title = "Mute";
  } else {
    volBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="vol-icon-high"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    volBtn.title = "Mute";
  }
}

document.getElementById("volume-slider").addEventListener("input", (e) => {
  const sliderVal = parseFloat(e.target.value) / 100;
  setVolume(sliderVal);
});

// Liked status toggler
function toggleLikeTrack(trackId) {
  const index = state.likedTracks.indexOf(trackId);
  if (index === -1) {
    state.likedTracks.push(trackId);
  } else {
    state.likedTracks.splice(index, 1);
  }
  
  saveToLocalStorage();
  updateLikedSongsCounts();
  
  // Re-sync current display state
  const isNowLiked = state.likedTracks.includes(trackId);
  
  // If we are currently listening to this track, update footer heart icons
  const song = SONGS_DB[trackId];
  if (audio.src.includes(song.src)) {
    const heartIcons = [
      document.getElementById("player-heart-btn"),
      document.getElementById("right-panel-heart-btn")
    ];
    heartIcons.forEach(btn => {
      if (isNowLiked) {
        btn.classList.add("liked");
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      } else {
        btn.classList.remove("liked");
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-outline"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      }
    });
  }
  
  // Re-render pages
  if (state.currentPage === "liked-songs") {
    renderLikedSongsDetail();
  } else if (state.currentPage === "playlist" && state.activePlaylistId) {
    renderPlaylistDetail(state.activePlaylistId);
  } else if (state.currentPage === "search") {
    runSearch();
  }
}

function updateLikedSongsCounts() {
  const cnt = state.likedTracks.length;
  document.getElementById("liked-count").textContent = cnt;
  
  const statsEl = document.getElementById("liked-songs-stats");
  if (statsEl) {
    statsEl.textContent = `${cnt} song${cnt !== 1 ? 's' : ''}`;
  }
}

// Queue system helpers
function addToQueue(trackId) {
  state.queue.push(trackId);
  if (state.currentPage === "queue") {
    renderQueueDetail();
  }
}

function clearQueue() {
  state.queue = [];
  if (state.currentPage === "queue") {
    renderQueueDetail();
  }
}

// ==========================================================================
// 6. DOM RENDERERS (LISTS, CARDS, GRID AND SIDEBAR)
// ==========================================================================

function renderSidebarPlaylists() {
  const listEl = document.getElementById("sidebar-playlist-list");
  
  // Remove existing custom playlist DOMs (keep Liked Songs)
  const items = listEl.querySelectorAll(".library-item");
  items.forEach(el => {
    if (el.getAttribute("data-page") !== "liked-songs") {
      el.remove();
    }
  });
  
  // Add Default playlists in sidebar
  Object.keys(DEFAULT_PLAYLISTS).forEach(key => {
    const pl = DEFAULT_PLAYLISTS[key];
    const el = document.createElement("div");
    el.className = "library-item";
    el.setAttribute("data-playlist-id", pl.id);
    el.innerHTML = `
      <div class="library-item-icon">
        <img src="${pl.cover}" alt="${pl.title}">
      </div>
      <div class="library-item-info">
        <div class="library-item-title">${pl.title}</div>
        <div class="library-item-subtitle">Playlist • ${pl.songs.length} songs</div>
      </div>
    `;
    el.addEventListener("click", () => navigateTo("playlist", pl.id));
    listEl.appendChild(el);
  });
  
  // Add custom playlists in sidebar
  Object.keys(state.customPlaylists).forEach(id => {
    const pl = state.customPlaylists[id];
    const el = document.createElement("div");
    el.className = "library-item";
    el.setAttribute("data-playlist-id", pl.id);
    el.innerHTML = `
      <div class="library-item-icon" style="background-color: #242424">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-grey); width: 24px; height: 24px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </div>
      <div class="library-item-info">
        <div class="library-item-title">${pl.title}</div>
        <div class="library-item-subtitle">Playlist • ${pl.songs.length} songs</div>
      </div>
    `;
    el.addEventListener("click", () => navigateTo("playlist", pl.id));
    listEl.appendChild(el);
  });
}

function renderHomeShelf() {
  const shelf = document.getElementById("home-songs-shelf");
  shelf.innerHTML = "";
  
  // Render Sai Abhyankkar's 4 core songs as cards
  Object.keys(SONGS_DB).forEach(key => {
    const song = SONGS_DB[key];
    const el = document.createElement("div");
    el.className = "song-card";
    el.innerHTML = `
      <div class="card-image-container">
        <img src="${song.cover}" alt="${song.title}" class="song-card-img">
        <button class="card-play-btn" data-song-id="${song.id}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <h3>${song.title}</h3>
      <p>${song.artist}</p>
    `;
    
    // Play on card click or card play btn click
    el.addEventListener("click", (e) => {
      if (e.target.closest(".card-play-btn")) {
        loadTrack(song.id, "sai-hits", true);
      } else {
        loadTrack(song.id, "sai-hits", true);
      }
    });
    shelf.appendChild(el);
  });
}

function renderPlaylistDetail(playlistId) {
  let pl = DEFAULT_PLAYLISTS[playlistId] || state.customPlaylists[playlistId];
  if (!pl) return;
  
  // Render header
  document.getElementById("playlist-banner").style.background = `linear-gradient(to bottom, ${pl.themeColor || '#242424'}, rgba(18, 18, 18, 1))`;
  document.getElementById("playlist-detail-cover").src = pl.cover || "assets/images/pavazha_malli.png"; // default
  
  // If custom empty cover art
  if (!pl.cover) {
    const coverWrapper = document.getElementById("playlist-detail-cover").parentNode;
    coverWrapper.classList.add("liked-gradient", "large-icon-cover");
    coverWrapper.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
  } else {
    const coverWrapper = document.getElementById("playlist-detail-cover").parentNode;
    coverWrapper.className = "playlist-banner-cover";
    coverWrapper.innerHTML = `<img src="${pl.cover}" id="playlist-detail-cover" alt="Playlist cover">`;
  }
  
  document.getElementById("playlist-detail-title").textContent = pl.title;
  document.getElementById("playlist-detail-desc").textContent = pl.description || "No description.";
  
  const songCount = pl.songs.length;
  let totalDur = pl.songs.reduce((acc, songId) => acc + (SONGS_DB[songId]?.duration || 0), 0);
  document.getElementById("playlist-detail-stats").textContent = `${songCount} song${songCount !== 1 ? 's' : ''}, ${formatTotalDuration(totalDur)}`;
  
  // Show/Hide delete button on custom playlists
  const delBtn = document.getElementById("playlist-delete-btn");
  if (pl.isEditable) {
    delBtn.style.display = "block";
    delBtn.onclick = () => deletePlaylist(playlistId);
  } else {
    delBtn.style.display = "none";
  }
  
  // Handle Play Button click on top
  const playBtn = document.getElementById("playlist-detail-play-btn");
  playBtn.onclick = () => {
    if (pl.songs.length === 0) return;
    
    // If we are already playing this playlist, toggle play/pause
    if (state.currentPlaylistId === playlistId && state.isPlaying) {
      pauseTrack();
    } else if (state.currentPlaylistId === playlistId && !state.isPlaying) {
      playTrack();
    } else {
      loadTrack(pl.songs[0], playlistId, true);
    }
  };
  
  // Render songs rows in the table
  const tbody = document.getElementById("playlist-songs-tbody");
  tbody.innerHTML = "";
  
  if (pl.songs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No songs in this playlist yet. Add songs from search or home!</td></tr>`;
    return;
  }
  
  pl.songs.forEach((songId, index) => {
    const song = SONGS_DB[songId];
    if (!song) return;
    
    const tr = document.createElement("tr");
    tr.setAttribute("data-song-id", songId);
    
    // Highlight if active
    const isPlayingCurrent = audio.src.includes(song.src);
    if (isPlayingCurrent) {
      tr.classList.add("active-song");
    }
    
    const isLiked = state.likedTracks.includes(songId);
    
    tr.innerHTML = `
      <td class="col-num">
        <div class="index-cell-content">
          <span class="index-cell-num">${index + 1}</span>
          <button class="index-cell-play icon-btn-text">
            ${isPlayingCurrent && state.isPlaying ? 
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>` : 
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`}
          </button>
        </div>
      </td>
      <td class="col-title title-cell">
        <img src="${song.cover}" alt="${song.title}">
        <div class="title-cell-text">
          <span class="cell-title">${song.title}</span>
          <span class="cell-artist">${song.artist}</span>
        </div>
      </td>
      <td class="col-album">${song.album}</td>
      <td class="col-date">2 weeks ago</td>
      <td class="col-duration">${formatTime(song.duration)}</td>
      <td class="col-actions">
        <div class="row-actions-box">
          <button class="like-btn ${isLiked ? 'liked' : ''}" data-song-id="${songId}">
            ${isLiked ? 
              `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` : 
              `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`}
          </button>
          
          <button class="row-action-btn add-to-playlist-row-btn" data-song-id="${songId}" title="Playlist Options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>
        </div>
      </td>
    `;
    
    // Play on row double click or index play click
    tr.addEventListener("dblclick", () => {
      loadTrack(songId, playlistId, true);
    });
    tr.querySelector(".index-cell-play").addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlayingCurrent) {
        togglePlay();
      } else {
        loadTrack(songId, playlistId, true);
      }
    });
    
    // Like toggle inside row
    tr.querySelector(".like-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLikeTrack(songId);
    });
    
    // Context Options button click (Quick Add menu)
    tr.querySelector(".add-to-playlist-row-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showPlaylistOptionsPopover(e.clientX, e.clientY, songId);
    });
    
    tbody.appendChild(tr);
  });
}

function renderLikedSongsDetail() {
  const tbody = document.getElementById("liked-songs-tbody");
  tbody.innerHTML = "";
  
  const likedCount = state.likedTracks.length;
  updateLikedSongsCounts();
  
  if (likedCount === 0) {
    document.getElementById("liked-songs-empty-state").classList.remove("hidden");
    document.querySelector("#view-liked-songs .songs-table").style.display = "none";
    document.getElementById("liked-songs-play-btn").style.opacity = "0.5";
    return;
  }
  
  document.getElementById("liked-songs-empty-state").classList.add("hidden");
  document.querySelector("#view-liked-songs .songs-table").style.display = "table";
  document.getElementById("liked-songs-play-btn").style.opacity = "1";
  
  // Play all liked songs button
  document.getElementById("liked-songs-play-btn").onclick = () => {
    loadTrack(state.likedTracks[0], "liked-songs", true);
  };
  
  state.likedTracks.forEach((songId, index) => {
    const song = SONGS_DB[songId];
    if (!song) return;
    
    const tr = document.createElement("tr");
    tr.setAttribute("data-song-id", songId);
    
    const isPlayingCurrent = audio.src.includes(song.src);
    if (isPlayingCurrent) {
      tr.classList.add("active-song");
    }
    
    tr.innerHTML = `
      <td class="col-num">
        <div class="index-cell-content">
          <span class="index-cell-num">${index + 1}</span>
          <button class="index-cell-play icon-btn-text">
            ${isPlayingCurrent && state.isPlaying ? 
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>` : 
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`}
          </button>
        </div>
      </td>
      <td class="col-title title-cell">
        <img src="${song.cover}" alt="${song.title}">
        <div class="title-cell-text">
          <span class="cell-title">${song.title}</span>
          <span class="cell-artist">${song.artist}</span>
        </div>
      </td>
      <td class="col-album">${song.album}</td>
      <td class="col-date">Just now</td>
      <td class="col-duration">${formatTime(song.duration)}</td>
      <td class="col-actions">
        <div class="row-actions-box">
          <button class="like-btn liked" data-song-id="${songId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <button class="row-action-btn add-to-playlist-row-btn" data-song-id="${songId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>
        </div>
      </td>
    `;
    
    // Play row
    tr.addEventListener("dblclick", () => {
      loadTrack(songId, "liked-songs", true);
    });
    tr.querySelector(".index-cell-play").addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlayingCurrent) {
        togglePlay();
      } else {
        loadTrack(songId, "liked-songs", true);
      }
    });
    
    // Heart row click
    tr.querySelector(".like-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLikeTrack(songId);
    });
    
    tr.querySelector(".add-to-playlist-row-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showPlaylistOptionsPopover(e.clientX, e.clientY, songId);
    });
    
    tbody.appendChild(tr);
  });
}

function renderQueueDetail() {
  // Current track row
  const currentContainer = document.getElementById("queue-now-playing-list");
  currentContainer.innerHTML = "";
  
  const activeSongId = getCurrentlyPlayingTrackId();
  if (activeSongId) {
    const song = SONGS_DB[activeSongId];
    const el = document.createElement("div");
    el.className = "song-row-item active";
    el.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="song-row-meta">
        <span class="song-row-title">${song.title}</span>
        <span class="song-row-subtitle">${song.artist}</span>
      </div>
      <span class="song-row-duration">${formatTime(song.duration)}</span>
    `;
    currentContainer.appendChild(el);
  } else {
    currentContainer.innerHTML = `<div class="empty-state" style="padding: 16px 0;">No song playing</div>`;
  }
  
  // Next up tracks
  const nextContainer = document.getElementById("queue-next-up-list");
  nextContainer.innerHTML = "";
  
  if (state.queue.length === 0) {
    // If queue is empty, list the upcoming tracks in current playlist
    const upcomingPlaylistTracks = [];
    if (state.currentTrackList.length > 0) {
      for (let i = state.currentTrackIndex + 1; i < state.currentTrackList.length; i++) {
        upcomingPlaylistTracks.push(state.currentTrackList[i]);
      }
    }
    
    if (upcomingPlaylistTracks.length === 0) {
      nextContainer.innerHTML = `<div class="empty-state" style="padding: 16px 0;">Queue is empty</div>`;
      return;
    }
    
    upcomingPlaylistTracks.forEach((songId, index) => {
      const song = SONGS_DB[songId];
      const el = document.createElement("div");
      el.className = "song-row-item";
      el.innerHTML = `
        <img src="${song.cover}" alt="${song.title}">
        <div class="song-row-meta">
          <span class="song-row-title">${song.title}</span>
          <span class="song-row-subtitle">${song.artist} • <span style="font-size: 11px; opacity: 0.7;">From playlist</span></span>
        </div>
        <span class="song-row-duration">${formatTime(song.duration)}</span>
      `;
      nextContainer.appendChild(el);
    });
  } else {
    state.queue.forEach((songId, index) => {
      const song = SONGS_DB[songId];
      const el = document.createElement("div");
      el.className = "song-row-item";
      el.innerHTML = `
        <img src="${song.cover}" alt="${song.title}">
        <div class="song-row-meta">
          <span class="song-row-title">${song.title}</span>
          <span class="song-row-subtitle">${song.artist}</span>
        </div>
        <span class="song-row-duration">${formatTime(song.duration)}</span>
      `;
      nextContainer.appendChild(el);
    });
  }
}

function showPlaylistOptionsPopover(x, y, songId) {
  // Remove existing dropdowns
  const oldMenu = document.getElementById("playlist-popover-menu");
  if (oldMenu) oldMenu.remove();
  
  const popover = document.createElement("div");
  popover.id = "playlist-popover-menu";
  popover.style.position = "fixed";
  popover.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
  popover.style.top = `${Math.min(y, window.innerHeight - 300)}px`;
  popover.style.backgroundColor = "#282828";
  popover.style.border = "1px solid #3e3e3e";
  popover.style.borderRadius = "4px";
  popover.style.padding = "6px 0";
  popover.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
  popover.style.zIndex = "99999";
  popover.style.width = "200px";
  
  let menuHTML = `
    <div class="popover-item" style="padding: 10px 16px; font-weight: 700; border-bottom: 1px solid var(--border-grey); font-size: 11px; text-transform: uppercase; color: var(--text-grey);">Add to Queue / Playlist</div>
    <div class="popover-action-item" id="add-to-queue-pop-btn" style="padding: 10px 16px; cursor: pointer; transition: background 0.1s;" hover-bg="#3e3e3e">Add to Queue</div>
  `;
  
  // Custom user playlists items
  const customPlaylistIds = Object.keys(state.customPlaylists);
  if (customPlaylistIds.length > 0) {
    menuHTML += `<div style="height: 1px; background-color: var(--border-grey); margin: 6px 0;"></div>`;
    customPlaylistIds.forEach(id => {
      const pl = state.customPlaylists[id];
      const hasSong = pl.songs.includes(songId);
      menuHTML += `
        <div class="popover-action-item add-to-custom-pl-btn" data-playlist-id="${id}" style="padding: 10px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 140px;">${pl.title}</span>
          ${hasSong ? `<span style="color: var(--spotify-green); font-size: 10px;">✓</span>` : ""}
        </div>
      `;
    });
  } else {
    menuHTML += `
      <div style="height: 1px; background-color: var(--border-grey); margin: 6px 0;"></div>
      <div id="pop-create-new-pl-btn" style="padding: 10px 16px; font-size: 12px; color: var(--text-grey); cursor: pointer;">+ Create new playlist</div>
    `;
  }
  
  popover.innerHTML = menuHTML;
  document.body.appendChild(popover);
  
  // Apply quick hover styles via JS
  popover.querySelectorAll(".popover-action-item").forEach(item => {
    item.addEventListener("mouseenter", () => item.style.backgroundColor = "#3e3e3e");
    item.addEventListener("mouseleave", () => item.style.backgroundColor = "");
  });
  
  // Click Handlers
  document.getElementById("add-to-queue-pop-btn").onclick = () => {
    addToQueue(songId);
    popover.remove();
  };
  
  const createNewBtn = document.getElementById("pop-create-new-pl-btn");
  if (createNewBtn) {
    createNewBtn.onclick = () => {
      popover.remove();
      openPlaylistModal();
    };
  }
  
  popover.querySelectorAll(".add-to-custom-pl-btn").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-playlist-id");
      toggleSongInPlaylist(pId, songId);
      popover.remove();
    };
  });
  
  // Close menu on outer clicks
  setTimeout(() => {
    const handleOutsideClick = (event) => {
      if (!popover.contains(event.target)) {
        popover.remove();
        document.removeEventListener("click", handleOutsideClick);
      }
    };
    document.addEventListener("click", handleOutsideClick);
  }, 10);
}

// ==========================================================================
// 7. SEARCH VIEW FUZZY FILTER ENGINE
// ==========================================================================

function runSearch() {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  
  const defaultState = document.getElementById("search-default-state");
  const resultsState = document.getElementById("search-results-state");
  
  if (query === "") {
    defaultState.classList.remove("hidden");
    resultsState.classList.add("hidden");
    document.getElementById("clear-search-btn").parentNode.classList.remove("has-text");
    return;
  }
  
  document.getElementById("clear-search-btn").parentNode.classList.add("has-text");
  defaultState.classList.add("hidden");
  resultsState.classList.remove("hidden");
  
  // Search logic
  const matches = [];
  Object.keys(SONGS_DB).forEach(key => {
    const song = SONGS_DB[key];
    const title = song.title.toLowerCase();
    const artist = song.artist.toLowerCase();
    const album = song.album.toLowerCase();

    if (title.includes(query) || artist.includes(query) || album.includes(query)) {
      let score = 0;
      if (title === query || artist === query) score += 50;
      if (title.startsWith(query)) score += 25;
      if (artist.startsWith(query)) score += 20;
      if (title.includes(query)) score += 10;
      if (artist.includes(query)) score += 8;
      if (album.includes(query)) score += 5;
      matches.push({ song, score });
    }
  });

  matches.sort((a, b) => b.score - a.score);
  const rankedMatches = matches.map(item => item.song);
  
  // Render search layouts
  const topResultCard = document.getElementById("top-search-result-card");
  const songsListResults = document.getElementById("songs-search-results-list");
  
  topResultCard.innerHTML = "";
  songsListResults.innerHTML = "";
  
  if (rankedMatches.length === 0) {
    topResultCard.innerHTML = `<div class="empty-state" style="padding: 16px 0;"><h3>No results found for "${query}"</h3><p>Please check your spelling.</p></div>`;
    songsListResults.innerHTML = `<div class="empty-state" style="padding: 16px 0;">No songs matching</div>`;
    return;
  }
  
  // 1. Top Result Card (first match)
  const topSong = rankedMatches[0];
  topResultCard.innerHTML = `
    <img src="${topSong.cover}" alt="${topSong.title}">
    <h3>${topSong.title}</h3>
    <div class="top-result-meta-row">
      <span class="top-result-type">Song</span>
      <span style="color: var(--text-grey); font-size: 13px;">${topSong.artist}</span>
    </div>
    <button class="card-play-btn" data-song-id="${topSong.id}" aria-label="Play ${topSong.title}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </button>
  `;
  
  topResultCard.onclick = (e) => {
    loadTrack(topSong.id, "sai-hits", true);
  };
  
  // 2. Songs Matches list
  rankedMatches.slice(0, 4).forEach(song => {
    const isPlayingCurrent = audio.src.includes(song.src);
    const isLiked = state.likedTracks.includes(song.id);
    
    const row = document.createElement("div");
    row.className = `song-row-item ${isPlayingCurrent ? 'active' : ''}`;
    row.setAttribute("data-song-id", song.id);
    
    row.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="song-row-meta">
        <span class="song-row-title">${song.title}</span>
        <span class="song-row-subtitle">${song.artist}</span>
      </div>
      
      <div class="row-actions-box" style="margin-right: 16px;">
        <button class="like-btn search-row-like-btn ${isLiked ? 'liked' : ''}" data-song-id="${song.id}">
          ${isLiked ? 
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` : 
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`}
        </button>
        <button class="row-action-btn search-row-add-pl-btn" data-song-id="${song.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </button>
      </div>
      
      <span class="song-row-duration">${formatTime(song.duration)}</span>
    `;
    
    row.onclick = (e) => {
      if (e.target.closest(".like-btn")) {
        toggleLikeTrack(song.id);
      } else if (e.target.closest(".row-action-btn")) {
        showPlaylistOptionsPopover(e.clientX, e.clientY, song.id);
      } else {
        loadTrack(song.id, "sai-hits", true);
      }
    };
    songsListResults.appendChild(row);
  });
}

// ==========================================================================
// 8. PLAYLISTS MODIFIERS (CREATE & DELETE)
// ==========================================================================

function openPlaylistModal() {
  document.getElementById("playlist-name-input").value = "";
  document.getElementById("playlist-desc-input").value = "";
  document.getElementById("create-playlist-modal").classList.add("open");
}

function closePlaylistModal() {
  document.getElementById("create-playlist-modal").classList.remove("open");
}

function handleCreatePlaylistSubmit() {
  const nameInput = document.getElementById("playlist-name-input").value.trim();
  const descInput = document.getElementById("playlist-desc-input").value.trim();
  
  const title = nameInput || `My Playlist #${Object.keys(state.customPlaylists).length + 1}`;
  const id = `playlist_${Date.now()}`;
  
  // Random subtle theme gradients for playlists
  const colors = ["#472275", "#275e3c", "#1c4e70", "#63561a", "#782222", "#475249"];
  const randColor = colors[Math.floor(Math.random() * colors.length)];
  
  state.customPlaylists[id] = {
    id: id,
    title: title,
    description: descInput || "A custom curated playlist.",
    cover: null, // empty icon
    songs: [],
    themeColor: randColor,
    isEditable: true
  };
  
  saveToLocalStorage();
  renderSidebarPlaylists();
  closePlaylistModal();
  showStatus(`Playlist created: ${title}`);
  
  // Navigate to newly created empty playlist
  navigateTo("playlist", id);
}

function deletePlaylist(id) {
  if (confirm(`Are you sure you want to delete this playlist?`)) {
    delete state.customPlaylists[id];
    saveToLocalStorage();
    renderSidebarPlaylists();
    navigateTo("home");
  }
}

function toggleSongInPlaylist(playlistId, songId) {
  const pl = state.customPlaylists[playlistId];
  if (!pl) return;
  
  const index = pl.songs.indexOf(songId);
  if (index === -1) {
    pl.songs.push(songId);
  } else {
    pl.songs.splice(index, 1);
  }
  
  saveToLocalStorage();
  renderSidebarPlaylists();
  
  // Re-render playlist if it is active detail page
  if (state.currentPage === "playlist" && state.activePlaylistId === playlistId) {
    renderPlaylistDetail(playlistId);
  }
}

// ==========================================================================
// 9. WEB AUDIO API FREQUENCY SPECTRUM VISUALIZER
// ==========================================================================

function initAudioContext() {
  if (audioContext) return; // already initialized
  
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 64; // nice spacing of frequency bands (32 frequency points)
    
    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
    
    document.getElementById("visualizer-placeholder-text").classList.add("hidden");
  } catch (err) {
    console.error("Failed to initialize Web Audio context (likely CORS or browser policy):", err);
    document.getElementById("visualizer-placeholder-text").textContent = "Audio spectrum blocked (CORS restriction).";
    document.getElementById("visualizer-placeholder-text").classList.remove("hidden");
  }
}

function startVisualizerAnimation() {
  if (!analyserNode) return;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  
  const canvas = document.getElementById("visualizer-canvas");
  const ctx = canvas.getContext("2d");
  
  // Make sure canvas resolution matches its display size
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  };
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    if (!state.isPlaying) return;
    
    animationFrameId = requestAnimationFrame(draw);
    
    resizeCanvas();
    
    analyserNode.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background gradient box
    const gradientBg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradientBg.addColorStop(0, '#0c0c0c');
    gradientBg.addColorStop(1, '#050505');
    ctx.fillStyle = gradientBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.45; // scale height to fit container
      
      // Select beautiful green gradient color
      const greenIntensity = Math.min(255, 100 + (dataArray[i] * 0.6));
      ctx.fillStyle = `rgb(29, ${greenIntensity}, 84)`; // Spotify Green based highlight
      
      // Draw rounded/smooth rectangles
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 3, barHeight);
      
      x += barWidth;
    }
  }
  
  draw();
}

// Toggle visualizer checkbox listener
document.getElementById("toggle-visualizer-checkbox").addEventListener("change", (e) => {
  visualizerEnabled = e.target.checked;
  const canvas = document.getElementById("visualizer-canvas");
  if (visualizerEnabled) {
    canvas.style.display = "block";
    if (state.isPlaying) startVisualizerAnimation();
  } else {
    canvas.style.display = "none";
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
});

// ==========================================================================
// 10. EVENT BINDINGS & HELPERS
// ==========================================================================

function setupEventListeners() {
  
  // Navigation sidebar links
  document.querySelectorAll(".sidebar-top-box button[data-page]").forEach(link => {
    link.addEventListener("click", () => {
      navigateTo(link.getAttribute("data-page"));
    });
  });
  
  document.querySelector(".sidebar-library-box .library-item")?.addEventListener("click", () => {
    navigateTo("liked-songs");
  });
  
  // Header history arrows
  document.getElementById("nav-back-btn").addEventListener("click", handleHistoryBack);
  document.getElementById("nav-forward-btn").addEventListener("click", handleHistoryForward);
  
  // Header Scrolling fade effect
  const mainContentDOM = document.querySelector(".main-content");
  mainContentDOM.addEventListener("scroll", updateHeaderScrolledState);
  
  // Search inputs
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", runSearch);
  
  document.getElementById("clear-search-btn").addEventListener("click", () => {
    searchInput.value = "";
    runSearch();
    searchInput.focus();
  });
  
  // Footer main media play buttons
  document.getElementById("play-pause-btn").addEventListener("click", togglePlay);
  document.getElementById("prev-btn").addEventListener("click", prevTrack);
  document.getElementById("next-btn").addEventListener("click", nextTrack);
  document.getElementById("shuffle-btn").addEventListener("click", toggleShuffle);
  document.getElementById("repeat-btn").addEventListener("click", toggleRepeat);
  
  // Volume media controllers
  document.getElementById("volume-mute-btn").addEventListener("click", toggleMute);
  
  // Playlist Modal buttons
  document.getElementById("create-playlist-btn").addEventListener("click", openPlaylistModal);
  document.getElementById("close-modal-btn").addEventListener("click", closePlaylistModal);
  document.getElementById("save-playlist-btn").addEventListener("click", handleCreatePlaylistSubmit);
  
  // Close modal when clicking outside form box
  const modal = document.getElementById("create-playlist-modal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePlaylistModal();
  });
  
  // Bottom toggles buttons
  document.getElementById("queue-toggle-btn").addEventListener("click", () => {
    if (state.currentPage === "queue") {
      navigateTo("home");
    } else {
      navigateTo("queue");
    }
  });
  
  document.getElementById("clear-queue-btn").addEventListener("click", clearQueue);
  
  // Now Playing Right Panel slider toggle
  const rightPanelBtn = document.getElementById("now-playing-panel-toggle-btn");
  const closeRightPanelBtn = document.getElementById("close-right-panel-btn");
  
  const toggleRightPanel = () => {
    const appContainer = document.querySelector(".app-container");
    appContainer.classList.toggle("show-right-panel");
    
    // Toggle active footer button color state
    if (appContainer.classList.contains("show-right-panel")) {
      rightPanelBtn.classList.add("active");
      if (state.isPlaying && visualizerEnabled) startVisualizerAnimation();
    } else {
      rightPanelBtn.classList.remove("active");
    }
  };
  
  rightPanelBtn.addEventListener("click", toggleRightPanel);
  closeRightPanelBtn.addEventListener("click", () => {
    document.querySelector(".app-container").classList.remove("show-right-panel");
    rightPanelBtn.classList.remove("active");
  });
  
  // Heart buttons on player & sidebar panels
  const heartToggle = () => {
    const activeSongId = getCurrentlyPlayingTrackId();
    if (activeSongId) toggleLikeTrack(activeSongId);
  };
  document.getElementById("player-heart-btn").addEventListener("click", heartToggle);
  document.getElementById("right-panel-heart-btn").addEventListener("click", heartToggle);
  
  // Quick play cards bindings on Home page
  document.querySelectorAll(".quick-card").forEach(card => {
    card.addEventListener("click", (e) => {
      const plId = card.getAttribute("data-playlist");
      const list = getPlaylistSongs(plId);
      if (list.length > 0) {
        if (e.target.closest(".quick-play-btn")) {
          loadTrack(list[0], plId, true);
        } else {
          navigateTo("playlist", plId);
        }
      } else {
        navigateTo(plId === "liked-songs" ? "liked-songs" : "playlist", plId);
      }
    });
  });
  
  // Shelf playlists cards on Home page
  document.querySelectorAll(".playlist-card").forEach(card => {
    card.addEventListener("click", (e) => {
      const plId = card.getAttribute("data-playlist");
      const list = getPlaylistSongs(plId);
      if (list.length > 0) {
        if (e.target.closest(".card-play-btn")) {
          loadTrack(list[0], plId, true);
        } else {
          navigateTo("playlist", plId);
        }
      }
    });
  });
  
  // Microphone icon triggers Now Playing right panel view
  document.getElementById("lyrics-visualizer-toggle-btn").addEventListener("click", () => {
    const appContainer = document.querySelector(".app-container");
    if (!appContainer.classList.contains("show-right-panel")) {
      toggleRightPanel();
    }
    // Scroll right panel down to visualizer
    const rightPanelScroll = document.querySelector(".panel-scroll-content");
    const visBox = document.querySelector(".visualizer-box");
    if (rightPanelScroll && visBox) {
      rightPanelScroll.scrollTop = visBox.offsetTop - 20;
      
      // Add quick glow highlight to visualizer box
      visBox.style.boxShadow = "0 0 12px var(--spotify-green)";
      setTimeout(() => {
        visBox.style.boxShadow = "";
      }, 1000);
    }
  });
}

function updateHeaderScrolledState() {
  const activeViewDOM = document.getElementById(`view-${state.currentPage}`);
  if (!activeViewDOM) return;
  
  const scrollContent = activeViewDOM.querySelector(".view-scroll-content") || activeViewDOM;
  const header = document.querySelector(".main-header");
  
  if (scrollContent.scrollTop > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

// ==========================================================================
// 11. HELPERS & FORMATTERS
// ==========================================================================

function getPlaylistSongs(playlistId) {
  if (playlistId === "liked-songs") return state.likedTracks;
  const pl = DEFAULT_PLAYLISTS[playlistId] || state.customPlaylists[playlistId];
  return pl ? pl.songs : [];
}

function getCurrentlyPlayingTrackId() {
  // Extract track ID from audio src file name or match it in SONGS_DB
  const currentSrc = audio.src;
  if (!currentSrc) return null;
  
  const match = Object.keys(SONGS_DB).find(key => currentSrc.includes(SONGS_DB[key].src));
  return match || null;
}

function setPlaylistViewBannerColor(colorHex) {
  // If we are looking at a playlist page, set its banner background color
  const banner = document.getElementById("playlist-banner");
  if (banner && state.currentPage === "playlist" && state.activePlaylistId) {
    const pl = DEFAULT_PLAYLISTS[state.activePlaylistId] || state.customPlaylists[state.activePlaylistId];
    if (pl) {
      banner.style.background = `linear-gradient(to bottom, ${colorHex}, rgba(18, 18, 18, 1))`;
    }
  }
}

function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function formatTotalDuration(secs) {
  const hr = Math.floor(secs / 3600);
  const min = Math.floor((secs % 3600) / 60);
  const sec = Math.floor(secs % 60);
  
  let str = "";
  if (hr > 0) {
    str += `${hr} hr `;
  }
  str += `${min} min ${sec} sec`;
  return str;
}

// Global exposure for event callbacks in inline HTML calls if any
window.app = {
  navigateTo,
  toggleLikeTrack,
  loadTrack
};

// Start application
window.addEventListener("DOMContentLoaded", initApp);
