# Graph Report - Choir Book Pro  (2026-11-22)

## Corpus Check
- 73 files · ~142,174 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 414 nodes · 1041 edges · 32 communities (15 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- PPT Mode & Piano Engine
- Song & Setlist Management
- Chord Charts & GSMA Export
- Core App Controller & Cues
- Chord Parser & Liturgical Cues
- Android Google One-Tap Native
- Editor Overlay & UI Icons
- OCR Scanner & Sheet Exporter
- Firestore & Store Persistence
- Android Unit & UI Tests
- Setlist & Viewer Filtering
- PWA Web App Manifest
- Android Native Orientation & File Plugin
- Offline Write Queue & Sync
- Android MainActivity Bridge
- Store Batch Query Helpers
- Architecture & Sync Documentation
- HTML App Entrypoint & SDKs
- JS Service Worker Shell
- Root Service Worker Cache
- App Icons & Splash Assets

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 62 edges
2. `wireModal()` - 48 edges
3. `renderListView()` - 42 edges
4. `escapeHtml()` - 33 edges
5. `renderEditor()` - 33 edges
6. `renderSetlistEditor()` - 27 edges
7. `modalHtml()` - 25 edges
8. `renderSongSheetContent()` - 23 edges
9. `render()` - 22 edges
10. `get()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `index.html App Entrypoint` --references--> `PWA & Android Launcher/Splash Icons`  [EXTRACTED]
  index.html → icons/icon-512.png
- `Google Auth & One-Tap Integration Guide` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  GOOGLE_AUTH_SETUP.md → DESIGN_PLAN.md
- `Liturgical Mass Order & Cues Structure` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  Mass-Flow.md → DESIGN_PLAN.md
- `Choir Book Pro Improvements & Changelog` --references--> `Choir Book Pro Architecture Blueprint`  [EXTRACTED]
  IMPROVEMENTS.md → DESIGN_PLAN.md
- `Development & Capacitor Setup Instructions` --references--> `index.html App Entrypoint`  [EXTRACTED]
  SETUP_INSTRUCTIONS.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Choir Book Documentation & Architecture Suite** — design_plan_architecture_blueprint, google_auth_setup_guide, improvements_changelog, mass_flow_liturgy_structure, setup_instructions_dev_guide [EXTRACTED 1.00]

## Communities (32 total, 17 thin omitted)

### Community 0 - "PPT Mode & Piano Engine"
Cohesion: 0.06
Nodes (56): acquirePptWakeLock(), buildPptSectionAnchors(), buildPptSlides(), currentSong(), getActiveViewerFontSize(), getCueAccidentalsPref(), getCueChordMap(), getCueChordText() (+48 more)

### Community 1 - "Song & Setlist Management"
Cohesion: 0.09
Nodes (56): autoOrganizeAllSongsByTitle(), cleanSongTitleForDisplay(), closeEditorOverlay(), deleteFromTrashForever(), detectKeyFromBody(), emptyTrashForever(), extractChordsFromBody(), generateGSMA() (+48 more)

### Community 2 - "Chord Charts & GSMA Export"
Cohesion: 0.06
Nodes (16): autoAssignFoldersByTitle(), currentSetlist(), findAudioStartOffset(), iconArrowDown(), iconArrowUp(), iconEye(), iconEyeOff(), inferMassPartFromGsmaTitle() (+8 more)

### Community 3 - "Core App Controller & Cues"
Cohesion: 0.11
Nodes (36): applyFolderTheme(), buildFretboardSVG(), buildKeyboardSVG(), buildSongListRowsHtml(), downloadGSMA(), escapeHtml(), getCurrentViewSectionTitle(), getFolderTheme() (+28 more)

### Community 4 - "Chord Parser & Liturgical Cues"
Cohesion: 0.07
Nodes (25): config, author, dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor-firebase/authentication (+17 more)

### Community 6 - "Android Google One-Tap Native"
Cohesion: 0.13
Nodes (25): classifyLine(), extractPriestData(), extractResponseData(), findMassPartCue(), getMassPartCueKey(), iconCueHide(), iconCueShow(), iconPeopleGroup() (+17 more)

### Community 7 - "Editor Overlay & UI Icons"
Cohesion: 0.12
Nodes (21): _col(), get(), getAll(), getAllSetlists(), getAllSongs(), getArtists(), getCategories(), getCueChords() (+13 more)

### Community 8 - "OCR Scanner & Sheet Exporter"
Cohesion: 0.16
Nodes (9): blobToBase64(), buildExportBlocks(), buildPrintableSongHtml(), escHtml(), isExportChordOrMelodyLine(), isExportLyricSectionHeader(), layoutBlocksForColumn(), triggerBlobDownload() (+1 more)

### Community 9 - "Firestore & Store Persistence"
Cohesion: 0.19
Nodes (14): ensureCollectInPsalmCue(), ensureGreatAmenMigration(), getCanonicalUserDocId(), getLastSyncAt(), hydrateInitialState(), loadAll(), normalizeSetlist(), normalizeSong() (+6 more)

### Community 11 - "Setlist & Viewer Filtering"
Cohesion: 0.20
Nodes (11): getActiveScopeKey(), getExpandedSetlistItemsWithLit(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getViewerSongList(), isSeededDefaultSong(), isSongExcluded() (+3 more)

### Community 12 - "PWA Web App Manifest"
Cohesion: 0.29
Nodes (10): bakeChordAudioBuffer(), chordTones(), ensurePianoAudioBus(), getGuitarShape(), noteIndex(), parseChordToken(), playPianoChord(), playPianoNote() (+2 more)

### Community 13 - "Android Native Orientation & File Plugin"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "Android MainActivity Bridge"
Cohesion: 0.28
Nodes (9): clearOfflineDirtyKey(), delete(), deleteSetlist(), deleteSong(), flushOfflineDirtyQueue(), getOfflineDirtyMap(), markOfflineDirtyKey(), saveSong() (+1 more)

### Community 17 - "Architecture & Sync Documentation"
Cohesion: 0.33
Nodes (6): Choir Book Pro Architecture Blueprint, Information Architecture & Navigation, Offline-First Storage Engine, Google Auth & One-Tap Integration Guide, Choir Book Pro Improvements & Changelog, Liturgical Mass Order & Cues Structure

### Community 18 - "HTML App Entrypoint & SDKs"
Cohesion: 0.40
Nodes (5): Firebase Compat SDK (App, Auth, Firestore), Google Fonts (Manrope, Montserrat, JetBrains Mono), index.html App Entrypoint, PWA & Android Launcher/Splash Icons, Development & Capacitor Setup Instructions

## Knowledge Gaps
- **15 isolated node(s):** `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `@capacitor/screen-orientation` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Song & Setlist Management` to `Chord Charts & GSMA Export`, `Core App Controller & Cues`, `Android Google One-Tap Native`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PPT Mode & Piano Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06038961038961039 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `PPT Mode & Piano Engine` to `Song & Setlist Management`, `Chord Charts & GSMA Export`, `Core App Controller & Cues`, `Android Google One-Tap Native`, `Setlist & Viewer Filtering`, `PWA Web App Manifest`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `Song & Setlist Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08701298701298701 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Song & Setlist Management` to `PPT Mode & Piano Engine`, `Chord Charts & GSMA Export`, `Core App Controller & Cues`, `Android Google One-Tap Native`, `Setlist & Viewer Filtering`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Should `Chord Charts & GSMA Export` be split into smaller, more focused modules?**
  _Cohesion score 0.06006006006006006 - nodes in this community are weakly interconnected._