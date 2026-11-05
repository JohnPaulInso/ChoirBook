# Graph Report - Choir Book Pro  (2026-11-05)

## Corpus Check
- 55 files · ~115,114 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 288 nodes · 696 edges · 24 communities (10 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Viewer Navigation & Overlay System
- Music Rendering & SVG Visualizers
- Folder Organization & GSMA Sync
- Key Detection & Song Filtering
- Android Google One Tap Plugin
- Liturgical Dialogue & Line Classifier
- Package Configuration & Dependencies
- Folder Themes & State Hydration
- Android Native Unit Tests
- PWA Web App Manifest
- Android Main Bridge Activity
- Chord Parser & Mass Part Heuristics
- Architecture Specs & Mass Flow Docs
- HTML Host & Setup Guide
- Offline Service Worker Shell
- Root Service Worker Cache

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 41 edges
2. `renderListView()` - 34 edges
3. `wireModal()` - 30 edges
4. `renderEditor()` - 27 edges
5. `escapeHtml()` - 25 edges
6. `modalHtml()` - 25 edges
7. `renderSongSheetContent()` - 22 edges
8. `renderSetlistEditor()` - 20 edges
9. `render()` - 18 edges
10. `sidebarHtml()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Choir Book Pro Improvements & History` --conceptually_related_to--> `Catholic Mass Flow Order & Liturgical Dialogues`  [INFERRED]
  IMPROVEMENTS.md → Mass-Flow.md
- `Choir Book Pro Design Plan` --references--> `Catholic Mass Flow Order & Liturgical Dialogues`  [EXTRACTED]
  DESIGN_PLAN.md → Mass-Flow.md
- `App HTML Shell & PWA Host` --references--> `Android APK & Capacitor Setup Instructions`  [EXTRACTED]
  index.html → SETUP_INSTRUCTIONS.md

## Import Cycles
- None detected.

## Communities (24 total, 14 thin omitted)

### Community 0 - "Viewer Navigation & Overlay System"
Cohesion: 0.06
Nodes (53): closeEditorOverlay(), _col(), currentSong(), delete(), deleteSetlist(), deleteSong(), get(), getAll() (+45 more)

### Community 1 - "Music Rendering & SVG Visualizers"
Cohesion: 0.07
Nodes (39): buildFretboardSVG(), buildKeyboardSVG(), buildSongListRowsHtml(), chordTones(), currentSetlist(), getActiveScopeKey(), getCurrentViewSectionTitle(), getEffectiveSongArtist() (+31 more)

### Community 2 - "Folder Organization & GSMA Sync"
Cohesion: 0.12
Nodes (28): autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), downloadGSMA(), findMassPartCue(), generateGSMA(), getMassPartCueKey(), iconMenu(), iconPalette() (+20 more)

### Community 3 - "Key Detection & Song Filtering"
Cohesion: 0.13
Nodes (23): cleanSongTitleForDisplay(), detectKeyFromBody(), getEffectiveSongKey(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getSongFlag(), getSongFlagRank() (+15 more)

### Community 5 - "Liturgical Dialogue & Line Classifier"
Cohesion: 0.21
Nodes (20): classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow(), iconPeopleGroup(), iconPriestCross() (+12 more)

### Community 6 - "Package Configuration & Dependencies"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 7 - "Folder Themes & State Hydration"
Cohesion: 0.19
Nodes (17): applyFolderTheme(), ensureGreatAmenMigration(), getFolderTheme(), hydrateInitialState(), iconBack(), iconSetlist(), loadAll(), normalizeSetlist() (+9 more)

### Community 9 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 11 - "Chord Parser & Mass Part Heuristics"
Cohesion: 0.40
Nodes (6): extractChordsFromBody(), inferMassPartFromGsmaTitle(), isRealChordToken(), normalizeBodyChordLines(), parseGSMA(), tokenLooksLikeChord()

### Community 13 - "Architecture Specs & Mass Flow Docs"
Cohesion: 0.67
Nodes (3): Choir Book Pro Design Plan, Choir Book Pro Improvements & History, Catholic Mass Flow Order & Liturgical Dialogues

## Knowledge Gaps
- **7 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `Choir Book Pro Design Plan`, `Choir Book Pro Improvements & History` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Key Detection & Song Filtering` to `Viewer Navigation & Overlay System`, `Music Rendering & SVG Visualizers`, `Folder Organization & GSMA Sync`, `Liturgical Dialogue & Line Classifier`, `Folder Themes & State Hydration`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Viewer Navigation & Overlay System` be split into smaller, more focused modules?**
  _Cohesion score 0.058384547848990345 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Viewer Navigation & Overlay System` to `Music Rendering & SVG Visualizers`, `Folder Organization & GSMA Sync`, `Key Detection & Song Filtering`, `Liturgical Dialogue & Line Classifier`, `Folder Themes & State Hydration`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `Music Rendering & SVG Visualizers` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._
- **Why does `renderListView()` connect `Folder Organization & GSMA Sync` to `Viewer Navigation & Overlay System`, `Music Rendering & SVG Visualizers`, `Liturgical Dialogue & Line Classifier`, `Folder Themes & State Hydration`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Folder Organization & GSMA Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._