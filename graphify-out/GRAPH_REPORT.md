# Graph Report - Choir Book Pro  (2026-11-07)

## Corpus Check
- 27 files · ~126,031 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 281 nodes · 669 edges · 28 communities (9 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `404e76e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- modalHtml
- buildSongListRowsHtml
- renderListView
- Lyric Parsing & Text Processing
- renderEditor
- NPM Dependencies & Package Config
- Android Test Suite
- Web App Manifest & PWA Configuration
- Android Screen Keep-Awake Plugin
- Android Main Activity & Native Lifecycle
- Service Worker Cache Controller
- Root Offline Service Worker
- Design Plan Architecture Documentation
- Google Auth Setup & SHA-1 Guide
- UI & Feature Improvements Specification
- HTML5 Shell & Google GIS Entrypoint
- Liturgical Mass Flow Documentation
- Setup & Build Instructions
- renderViewer

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 37 edges
2. `renderListView()` - 31 edges
3. `renderEditor()` - 28 edges
4. `escapeHtml()` - 27 edges
5. `modalHtml()` - 26 edges
6. `render()` - 20 edges
7. `renderSetlistEditor()` - 20 edges
8. `get()` - 19 edges
9. `renderSongSheetContent()` - 19 edges
10. `showToast()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `parseChordToken()` --calls--> `noteIndex()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 1 → community 0_
- `transposeKeyLabel()` --calls--> `spellNote()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 27 → community 1_
- `transposeBody()` --calls--> `transposeToken()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 1 → community 4_
- `transposeBody()` --calls--> `tokenLooksLikeChord()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 0 → community 4_
- `renderEditor()` --calls--> `detectKeyFromBody()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 0 → community 5_

## Import Cycles
- None detected.

## Communities (28 total, 19 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.06
Nodes (43): _col(), delete(), deleteSetlist(), deleteSong(), detectKeyFromBody(), ensureCollectInPsalmCue(), ensureGreatAmenMigration(), extractChordsFromBody() (+35 more)

### Community 1 - "modalHtml"
Cohesion: 0.13
Nodes (26): buildFretboardSVG(), buildKeyboardSVG(), chordTones(), currentSetlist(), formatRelativeTime(), getActiveScopeKey(), getEffectiveSongArtist(), getEffectiveSongKey() (+18 more)

### Community 2 - "buildSongListRowsHtml"
Cohesion: 0.18
Nodes (13): buildSongListRowsHtml(), getCurrentViewSectionTitle(), getExpandedSetlistItemsWithLit(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getViewerSongList(), isSeededDefaultSong() (+5 more)

### Community 3 - "renderListView"
Cohesion: 0.10
Nodes (39): applyFolderTheme(), autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), cleanSongTitleForDisplay(), closeActiveModal(), deleteFromTrashForever(), downloadGSMA(), emptyTrashForever() (+31 more)

### Community 4 - "Lyric Parsing & Text Processing"
Cohesion: 0.15
Nodes (22): classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), findMassPartCue(), getMassPartCueKey(), isMelodyNoteLine(), openCueEditor() (+14 more)

### Community 5 - "renderEditor"
Cohesion: 0.29
Nodes (10): closeEditorOverlay(), getAllKnownArtists(), insertAtCursor(), registerKnownArtist(), renderEditor(), performRedo(), performUndo(), pushHistoryState() (+2 more)

### Community 6 - "NPM Dependencies & Package Config"
Cohesion: 0.08
Nodes (23): config, author, dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor-firebase/authentication (+15 more)

### Community 8 - "Web App Manifest & PWA Configuration"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 27 - "renderViewer"
Cohesion: 0.12
Nodes (26): currentSong(), getCueAccidentalsPref(), getCueChordMap(), getCueChordText(), getCueKeyIdx(), getCueNoteMode(), getCueSemis(), handleStaffPlayClick() (+18 more)

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `Choir Book Pro Design Plan` (+5 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 67 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `renderEditor` to `app.js`, `modalHtml`, `buildSongListRowsHtml`, `renderListView`, `Lyric Parsing & Text Processing`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06327683615819209 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `renderViewer` to `app.js`, `modalHtml`, `buildSongListRowsHtml`, `renderListView`, `Lyric Parsing & Text Processing`, `renderEditor`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `modalHtml` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._
- **Why does `escapeHtml()` connect `Lyric Parsing & Text Processing` to `app.js`, `modalHtml`, `buildSongListRowsHtml`, `renderListView`, `renderEditor`, `renderViewer`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `renderListView` be split into smaller, more focused modules?**
  _Cohesion score 0.1039136302294197 - nodes in this community are weakly interconnected._