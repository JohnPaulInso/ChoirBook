# Choir Book — App Performance & Reliability Improvements Roadmap

## 1. Implemented Enhancements (Active)

### A. Live Real-Time Multi-Device Sync (Firestore `onSnapshot`)
- **Realtime Snapshot Listener**: Subscribed `onSnapshot` listener on `users/{userId}/data` in Firestore.
- **Cross-Device Sync**: Adding, editing, transposing, or deleting songs/setlists on one device automatically reflects instantly on all other logged-in devices without manual refresh.
- **Bi-Directional Local Mirroring**: Writes and snapshot changes sync directly to `localStorage` for 0ms instantaneous offline startup.

### B. Instant 0ms Cold Start & Multi-Layer Caching
- **Frame-1 Render**: Loads local cached songs immediately on boot while background network sync runs asynchronously.
- **Batch Querying**: Replaced N individual HTTP queries with single-query collection fetches.
- **Timeout Protection**: 2.5-second fallback guarantee so the app never gets stuck on "Loading your songs...".

### C. Persistent Storage Architecture
- **Firestore Offline Persistence**: Enabled `enablePersistence()` in Firebase SDK so IndexedDB caches all Firestore data locally on native Android and Web.

---

## 2. Recommended Future Reliability & Performance Roadmap

### 1. IndexedDB Dual-Store Migration (Replacing localStorage)
- **Benefit**: Upgrades storage capacity from 5MB (localStorage limit) to 500MB+ for thousands of songs with rich media.
- **Implementation**: Integrate `idb-keyval` or native IndexedDB adapter for song caching.

### 2. Virtualized List Rendering for 1,000+ Song Catalog
- **Benefit**: Smooth 60 FPS scrolling when choir songbooks grow beyond 500+ songs.
- **Implementation**: Render only visible song cards in DOM using windowing techniques.

### 3. Background Sync & Service Worker Workbox Integration
- **Benefit**: Guarantees queued song edits sync automatically when reconnecting after offline Masses.
- **Implementation**: Add Background Sync API listener in `sw.js`.

### 4. Audio Pitch & Tone Generator for Choir Directors
- **Benefit**: Built-in pitch pipe / reference key generator (Sine wave Web Audio API) directly in the song viewer.
- **Implementation**: Web Audio API oscillator node triggered from Key badge.

### 5. Multi-PDF / GSMA Export & Backup
- **Benefit**: Export current setlist or full songbook into printable PDF or `.gsma` backup zip file.
- **Implementation**: Client-side PDF generation using HTML5 canvas/jsPDF.
