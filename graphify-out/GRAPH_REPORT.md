# Graph Report - Choir Book Pro  (2026-11-03)

## Corpus Check
- 55 files · ~114,200 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 291 nodes · 687 edges · 24 communities (10 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.72)
- Token cost: 1,250 input · 450 output

## Community Hubs (Navigation)
- Core Application Store & State
- Song List & Viewport Rendering
- Folder Themes & GSMA Export
- Chord Diagrams & Fretboard Graphics
- Liturgical Dialogue & Cue Parsing
- Node Package & Dependencies
- Android Google One-Tap Auth
- Key Detection & Migration Utilities
- Android Unit & Instrumentation Tests
- PWA Web App Manifest
- Architecture & Liturgical Staff Specs
- Capacitor Native Activity Bridge
- Mobile PWA & Sync Architecture
- Service Worker Cache Shell
- Offline Asset Cache Manager
- Product Roadmap & Improvements

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 41 edges
2. `renderListView()` - 33 edges
3. `wireModal()` - 30 edges
4. `renderEditor()` - 27 edges
5. `modalHtml()` - 25 edges
6. `escapeHtml()` - 23 edges
7. `renderSongSheetContent()` - 22 edges
8. `renderSetlistEditor()` - 20 edges
9. `render()` - 17 edges
10. `sidebarHtml()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Canvas-based Intro Melody Staff Renderer` --visualizes--> `Liturgical Order of Mass`  [INFERRED]
  DESIGN_PLAN.md → Mass-Flow.md
- `Musical Chord Transposition Engine` --supports--> `Liturgical Order of Mass`  [INFERRED]
  DESIGN_PLAN.md → Mass-Flow.md
- `Offline-first Firestore and LocalStorage Sync` --coordinates_with--> `PWA Cache and Service Worker Shell`  [INFERRED]
  SETUP_INSTRUCTIONS.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **** — LiturgicalFlow, TranspositionEngine, StaffMelodyRenderer, AutoScrollController [INFERRED]

## Communities (24 total, 14 thin omitted)

### Community 0 - "Core Application Store & State"
Cohesion: 0.06
Nodes (52): closeEditorOverlay(), _col(), currentSong(), delete(), deleteSetlist(), deleteSong(), get(), getAll() (+44 more)

### Community 1 - "Song List & Viewport Rendering"
Cohesion: 0.09
Nodes (35): buildSongListRowsHtml(), cleanSongTitleForDisplay(), getActiveScopeKey(), getCurrentViewSectionTitle(), getEffectiveSongArtist(), getEffectiveSongKey(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs() (+27 more)

### Community 2 - "Folder Themes & GSMA Export"
Cohesion: 0.14
Nodes (30): applyFolderTheme(), autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), downloadGSMA(), generateGSMA(), getFolderTheme(), iconCheck(), iconMenu() (+22 more)

### Community 3 - "Chord Diagrams & Fretboard Graphics"
Cohesion: 0.11
Nodes (27): buildFretboardSVG(), buildKeyboardSVG(), chordTones(), currentSetlist(), getGuitarShape(), iconArrowDown(), iconArrowUp(), iconBack() (+19 more)

### Community 4 - "Liturgical Dialogue & Cue Parsing"
Cohesion: 0.15
Nodes (24): classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), findMassPartCue(), getMassPartCueKey(), iconCueHide(), iconCueShow() (+16 more)

### Community 5 - "Node Package & Dependencies"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 7 - "Key Detection & Migration Utilities"
Cohesion: 0.18
Nodes (16): detectKeyFromBody(), ensureGreatAmenMigration(), extractChordsFromBody(), hydrateInitialState(), inferMassPartFromGsmaTitle(), isRealChordToken(), loadAll(), normalizeBodyChordLines() (+8 more)

### Community 9 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 10 - "Architecture & Liturgical Staff Specs"
Cohesion: 0.40
Nodes (6): Live Performance Smooth Auto-scroll, Choir Book Pro Architectural and UX Design Plan, Liturgical Order of Mass, Catholic Liturgical Mass Parts Flow and Sequence, Canvas-based Intro Melody Staff Renderer, Musical Chord Transposition Engine

### Community 12 - "Mobile PWA & Sync Architecture"
Cohesion: 0.40
Nodes (5): Cross-platform Android Native Shell Bridge, Offline-first Firestore and LocalStorage Sync, PWA Cache and Service Worker Shell, Development, Capacitor, and Firebase Setup Guide, Single Page Application Shell and DOM Viewports

## Knowledge Gaps
- **8 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `Feature Enhancements and Performance Roadmap`, `Catholic Liturgical Mass Parts Flow and Sequence` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Song List & Viewport Rendering` to `Core Application Store & State`, `Folder Themes & GSMA Export`, `Chord Diagrams & Fretboard Graphics`, `Liturgical Dialogue & Cue Parsing`, `Key Detection & Migration Utilities`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Application Store & State` be split into smaller, more focused modules?**
  _Cohesion score 0.05879692446856626 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Core Application Store & State` to `Song List & Viewport Rendering`, `Folder Themes & GSMA Export`, `Chord Diagrams & Fretboard Graphics`, `Liturgical Dialogue & Cue Parsing`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `Song List & Viewport Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.08739495798319327 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Folder Themes & GSMA Export` to `Core Application Store & State`, `Song List & Viewport Rendering`, `Chord Diagrams & Fretboard Graphics`, `Liturgical Dialogue & Cue Parsing`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Folder Themes & GSMA Export` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._