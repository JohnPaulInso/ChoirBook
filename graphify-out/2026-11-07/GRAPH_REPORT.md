# Graph Report - Choir Book Pro  (2026-11-06)

## Corpus Check
- 56 files · ~127,319 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 316 nodes · 835 edges · 27 communities (8 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core App State & View Controllers
- Song List & Visualizer Renderers
- Liturgical Mass Cues & Folder Themes
- Song Metadata & Modal Handlers
- Lyric Parsing & Text Processing
- Music Theory & Chord Transposition
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

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 47 edges
2. `wireModal()` - 44 edges
3. `renderListView()` - 43 edges
4. `modalHtml()` - 34 edges
5. `renderEditor()` - 31 edges
6. `escapeHtml()` - 29 edges
7. `renderSetlistEditor()` - 28 edges
8. `render()` - 23 edges
9. `renderSongSheetContent()` - 22 edges
10. `renderSetlistsView()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `getGuitarShape()` --calls--> `noteIndex()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 4 → community 0_
- `modalHtml()` --calls--> `noteIndex()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 4 → community 1_
- `parseChordToken()` --calls--> `noteIndex()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 4 → community 5_
- `renderSetlistEditor()` --calls--> `transposeKeyLabel()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 4 → community 3_
- `modalHtml()` --calls--> `getGuitarShape()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 0 → community 1_

## Import Cycles
- None detected.

## Communities (27 total, 19 thin omitted)

### Community 0 - "Core App State & View Controllers"
Cohesion: 0.05
Nodes (58): closeEditorOverlay(), _col(), currentSong(), delete(), deleteSetlist(), deleteSong(), get(), getAll() (+50 more)

### Community 1 - "Song List & Visualizer Renderers"
Cohesion: 0.10
Nodes (37): buildFretboardSVG(), buildKeyboardSVG(), buildSongListRowsHtml(), downloadGSMA(), formatRelativeTime(), getActiveScopeKey(), getCurrentViewSectionTitle(), getFolderTheme() (+29 more)

### Community 2 - "Liturgical Mass Cues & Folder Themes"
Cohesion: 0.09
Nodes (34): applyFolderTheme(), ensureCollectInPsalmCue(), ensureGreatAmenMigration(), findMassPartCue(), getCanonicalUserDocId(), getExpandedSetlistItemsWithLit(), getFilteredSongsForCurrentView(), getLastSyncAt() (+26 more)

### Community 3 - "Song Metadata & Modal Handlers"
Cohesion: 0.13
Nodes (31): autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), cleanSongTitleForDisplay(), closeActiveModal(), currentSetlist(), deleteFromTrashForever(), emptyTrashForever(), generateGSMA() (+23 more)

### Community 4 - "Lyric Parsing & Text Processing"
Cohesion: 0.14
Nodes (28): chordTones(), classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow(), iconPeopleGroup() (+20 more)

### Community 5 - "Music Theory & Chord Transposition"
Cohesion: 0.11
Nodes (28): detectKeyFromBody(), extractChordsFromBody(), getEffectiveSongArtist(), getEffectiveSongKey(), getSongFlag(), getSongFlagRank(), iconCheckSmall(), iconDragBars() (+20 more)

### Community 6 - "NPM Dependencies & Package Config"
Cohesion: 0.09
Nodes (22): author, dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor-firebase/authentication, description (+14 more)

### Community 8 - "Web App Manifest & PWA Configuration"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

## Knowledge Gaps
- **11 isolated node(s):** `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app`, `@capacitor/cli`, `@capacitor/core` (+6 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 67 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Music Theory & Chord Transposition` to `Core App State & View Controllers`, `Song List & Visualizer Renderers`, `Liturgical Mass Cues & Folder Themes`, `Song Metadata & Modal Handlers`, `Lyric Parsing & Text Processing`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App State & View Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.05189189189189189 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Core App State & View Controllers` to `Song List & Visualizer Renderers`, `Liturgical Mass Cues & Folder Themes`, `Song Metadata & Modal Handlers`, `Lyric Parsing & Text Processing`, `Music Theory & Chord Transposition`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `Song List & Visualizer Renderers` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Song Metadata & Modal Handlers` to `Core App State & View Controllers`, `Song List & Visualizer Renderers`, `Liturgical Mass Cues & Folder Themes`, `Lyric Parsing & Text Processing`, `Music Theory & Chord Transposition`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `Liturgical Mass Cues & Folder Themes` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._