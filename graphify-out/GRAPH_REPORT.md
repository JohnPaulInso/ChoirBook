# Graph Report - Choir Book Pro  (2026-11-06)

## Corpus Check
- 55 files · ~120,071 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 300 nodes · 765 edges · 27 communities (9 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Storage & Firestore Sync
- List View & SVG Renderers
- Setlist & Modal Management
- Liturgical Catalog & Folders
- Text Classification & Dialogue Badges
- Android Google OneTap Plugin
- Song Transpose & Key Utilities
- NPM Dependencies & Build Config
- Android Instrumentation & Unit Tests
- Chord Parsing & Guitar Voicings
- PWA Web App Manifest
- Android Main Activity & Bridge
- Service Worker Script (js/sw.js)
- Root Service Worker (sw.js)
- Design Plan Architecture Spec
- Improvements & Change History
- PWA HTML Entrypoint
- Catholic Mass Liturgical Order
- Android APK Setup Guide

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 44 edges
2. `renderListView()` - 38 edges
3. `wireModal()` - 37 edges
4. `modalHtml()` - 31 edges
5. `renderEditor()` - 29 edges
6. `escapeHtml()` - 28 edges
7. `renderSetlistEditor()` - 25 edges
8. `render()` - 22 edges
9. `renderSongSheetContent()` - 22 edges
10. `renderFoldersView()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `modalHtml()` --calls--> `noteIndex()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 9 → community 1_
- `renderCuePianoFinder()` --calls--> `spellNote()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 9 → community 0_
- `transposeBody()` --calls--> `transposeToken()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 9 → community 4_
- `renderSetlistEditor()` --calls--> `transposeKeyLabel()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 9 → community 2_
- `renderSongRowHtml()` --calls--> `transposeKeyLabel()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 9 → community 6_

## Import Cycles
- None detected.

## Communities (27 total, 18 thin omitted)

### Community 0 - "Storage & Firestore Sync"
Cohesion: 0.06
Nodes (52): _col(), currentSong(), delete(), deleteSetlist(), deleteSong(), findMassPartCue(), get(), getAll() (+44 more)

### Community 1 - "List View & SVG Renderers"
Cohesion: 0.10
Nodes (36): buildFretboardSVG(), buildKeyboardSVG(), buildSongListRowsHtml(), downloadGSMA(), getActiveScopeKey(), getCurrentViewSectionTitle(), getFolderTheme(), iconCheck() (+28 more)

### Community 2 - "Setlist & Modal Management"
Cohesion: 0.12
Nodes (31): autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), closeActiveModal(), closeEditorOverlay(), currentSetlist(), generateGSMA(), handleUniversalBack(), iconArrowDown() (+23 more)

### Community 3 - "Liturgical Catalog & Folders"
Cohesion: 0.11
Nodes (26): applyFolderTheme(), cleanSongTitleForDisplay(), ensureGreatAmenMigration(), getFilteredSongsForCurrentView(), getLastSyncAt(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getSongFlag() (+18 more)

### Community 4 - "Text Classification & Dialogue Badges"
Cohesion: 0.18
Nodes (23): classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow(), iconPeopleGroup(), iconPriestCross() (+15 more)

### Community 6 - "Song Transpose & Key Utilities"
Cohesion: 0.17
Nodes (19): detectKeyFromBody(), getEffectiveSongArtist(), getEffectiveSongKey(), iconCheckSmall(), iconRedo(), iconUndo(), inferMassPartFromGsmaTitle(), inferSongArtist() (+11 more)

### Community 7 - "NPM Dependencies & Build Config"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 9 - "Chord Parsing & Guitar Voicings"
Cohesion: 0.20
Nodes (11): chordTones(), extractChordsFromBody(), getGuitarShape(), noteIndex(), parseChord(), parseChordToken(), shapeQuality(), spellNote() (+3 more)

### Community 10 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

## Knowledge Gaps
- **8 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `Choir Book Pro Design Plan`, `Choir Book Pro Improvements & History` (+3 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 66 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Song Transpose & Key Utilities` to `Storage & Firestore Sync`, `List View & SVG Renderers`, `Setlist & Modal Management`, `Liturgical Catalog & Folders`, `Text Classification & Dialogue Badges`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Storage & Firestore Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.05924920850293985 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Storage & Firestore Sync` to `List View & SVG Renderers`, `Setlist & Modal Management`, `Liturgical Catalog & Folders`, `Text Classification & Dialogue Badges`, `Song Transpose & Key Utilities`, `Chord Parsing & Guitar Voicings`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `List View & SVG Renderers` be split into smaller, more focused modules?**
  _Cohesion score 0.09841269841269841 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Setlist & Modal Management` to `Storage & Firestore Sync`, `List View & SVG Renderers`, `Liturgical Catalog & Folders`, `Text Classification & Dialogue Badges`, `Song Transpose & Key Utilities`, `Chord Parsing & Guitar Voicings`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `Setlist & Modal Management` be split into smaller, more focused modules?**
  _Cohesion score 0.12473118279569892 - nodes in this community are weakly interconnected._