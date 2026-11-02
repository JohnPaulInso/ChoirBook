# Graph Report - Choir Book Pro  (2026-11-02)

## Corpus Check
- Corpus is ~21,817 words - fits in a single context window. You may not need a graph.

## Summary
- 159 nodes · 311 edges · 19 communities (8 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 120 input · 85 output

## Community Hubs (Navigation)
- Firestore Database Adapter & Storage
- Chord Diagrams & SVG Visualizers
- Songbook State & Normalization
- Lyric Parsing & Song Viewer UI
- Capacitor Package Configuration
- Android Instrumentation & Unit Tests
- Setlist Navigation & Overlay Controller
- Web App Manifest Configuration
- Architecture Docs & Liturgical Flow
- Android Bridge Activity
- Service Worker Shell Cache

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 27 edges
2. `modalHtml()` - 20 edges
3. `renderSetlistEditor()` - 17 edges
4. `renderListView()` - 16 edges
5. `render()` - 12 edges
6. `wireModal()` - 12 edges
7. `sidebarHtml()` - 11 edges
8. `escapeHtml()` - 10 edges
9. `get()` - 10 edges
10. `renderEditor()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Choir Book Improvements Roadmap` --builds_upon--> `Firestore & Google Auth Setup`  [EXTRACTED]
  IMPROVEMENTS.md → SETUP_INSTRUCTIONS.md
- `App Web Entrypoint` --configures--> `Firestore & Google Auth Setup`  [EXTRACTED]
  index.html → SETUP_INSTRUCTIONS.md
- `Mass Flow Liturgical Structure` --defines_data_for--> `App Web Entrypoint`  [EXTRACTED]
  Mass-Flow.md → index.html

## Import Cycles
- None detected.

## Communities (19 total, 11 thin omitted)

### Community 0 - "Firestore Database Adapter & Storage"
Cohesion: 0.14
Nodes (16): _col(), delete(), deleteSetlist(), deleteSong(), get(), getAll(), getAllSetlists(), getAllSongs() (+8 more)

### Community 1 - "Chord Diagrams & SVG Visualizers"
Cohesion: 0.15
Nodes (21): buildFretboardSVG(), buildKeyboardSVG(), chordTones(), getGuitarShape(), iconClose(), iconEdit(), iconFolder(), iconImport() (+13 more)

### Community 2 - "Songbook State & Normalization"
Cohesion: 0.15
Nodes (20): loadAll(), mountEditorOverlay(), newSetlistItemId(), normalizeSetlist(), normalizeSong(), openEditor(), openViewer(), parseGSMA() (+12 more)

### Community 3 - "Lyric Parsing & Song Viewer UI"
Cohesion: 0.15
Nodes (19): classifyLine(), currentSong(), escapeHtml(), iconBigTriangleDown(), iconBigTriangleUp(), iconDots(), iconPause(), iconPlay() (+11 more)

### Community 4 - "Capacitor Package Configuration"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 6 - "Setlist Navigation & Overlay Controller"
Cohesion: 0.20
Nodes (12): closeEditorOverlay(), currentSetlist(), iconArrowDown(), iconArrowUp(), iconBack(), iconCross(), iconSetlist(), iconTrash() (+4 more)

### Community 7 - "Web App Manifest Configuration"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 8 - "Architecture Docs & Liturgical Flow"
Cohesion: 0.50
Nodes (4): Firestore & Google Auth Setup, Choir Book Improvements Roadmap, Mass Flow Liturgical Structure, App Web Entrypoint

## Knowledge Gaps
- **5 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `Choir Book Improvements Roadmap`, `Mass Flow Liturgical Structure`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 47 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderViewer()` connect `Lyric Parsing & Song Viewer UI` to `Firestore Database Adapter & Storage`, `Chord Diagrams & SVG Visualizers`, `Songbook State & Normalization`, `Setlist Navigation & Overlay Controller`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Firestore Database Adapter & Storage` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Why does `modalHtml()` connect `Chord Diagrams & SVG Visualizers` to `Firestore Database Adapter & Storage`, `Lyric Parsing & Song Viewer UI`, `Setlist Navigation & Overlay Controller`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Should `Chord Diagrams & SVG Visualizers` be split into smaller, more focused modules?**
  _Cohesion score 0.14761904761904762 - nodes in this community are weakly interconnected._
- **Should `Songbook State & Normalization` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Lyric Parsing & Song Viewer UI` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._