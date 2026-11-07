# Graph Report - Choir Book Pro  (2026-11-08)

## Corpus Check
- 57 files · ~129,865 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 328 nodes · 865 edges · 29 communities (16 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Folder Themes & Organization
- Song Viewer & Cue Overlays
- Music Visualizer & Setlists
- Music Theory & Metadata
- Project & Build Configuration
- Lyric Parsing & Liturgical Tags
- Song List & Dialogue Views
- Local Storage & IndexedDB Adapter
- Android Instrument Tests
- Chord Fingerings & Fretboards
- Web App Manifest & PWA
- Android Native One-Tap Plugin
- Database State Hydration & Migration
- Android Native Main Activity
- Song & Setlist Store Queries
- Architecture & Service Blueprints
- Authentication & Firebase Adapter
- Web Shell & Brand Assets
- Store Deletion Handlers
- Service Worker Shell Cache
- Root Service Worker Cache

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 52 edges
2. `wireModal()` - 44 edges
3. `renderListView()` - 43 edges
4. `modalHtml()` - 35 edges
5. `renderEditor()` - 33 edges
6. `escapeHtml()` - 29 edges
7. `renderSetlistEditor()` - 28 edges
8. `render()` - 23 edges
9. `renderSongSheetContent()` - 23 edges
10. `renderSetlistsView()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Web Application Shell Entrypoint` --references--> `Application Icon & Splash Branding Assets`  [EXTRACTED]
  index.html → icons/logo-1024.png
- `Google Auth & One-Tap Integration Guide` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  GOOGLE_AUTH_SETUP.md → DESIGN_PLAN.md
- `Liturgical Mass Order & Cues Structure` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  Mass-Flow.md → DESIGN_PLAN.md
- `Choir Book Pro Improvements & Changelog` --references--> `Choir Book Pro Architecture Blueprint`  [EXTRACTED]
  IMPROVEMENTS.md → DESIGN_PLAN.md
- `Development & Capacitor Setup Instructions` --references--> `Web Application Shell Entrypoint`  [EXTRACTED]
  SETUP_INSTRUCTIONS.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Choir Book Documentation & Architecture Suite** — design_plan_architecture_blueprint, google_auth_setup_guide, improvements_changelog, mass_flow_liturgy_structure, setup_instructions_dev_guide [EXTRACTED 1.00]

## Communities (29 total, 13 thin omitted)

### Community 0 - "Folder Themes & Organization"
Cohesion: 0.12
Nodes (52): applyFolderTheme(), autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), cleanSongTitleForDisplay(), closeActiveModal(), deleteFromTrashForever(), downloadGSMA(), emptyTrashForever() (+44 more)

### Community 1 - "Song Viewer & Cue Overlays"
Cohesion: 0.08
Nodes (37): closeEditorOverlay(), currentSong(), getCueAccidentalsPref(), getCueChordMap(), getCueChordText(), getCueKeyIdx(), getCueNoteMode(), getCueSemis() (+29 more)

### Community 2 - "Music Visualizer & Setlists"
Cohesion: 0.06
Nodes (16): buildFretboardSVG(), buildKeyboardSVG(), currentSetlist(), formatRelativeTime(), iconArrowDown(), iconArrowUp(), iconCross(), iconEye() (+8 more)

### Community 3 - "Music Theory & Metadata"
Cohesion: 0.10
Nodes (30): detectKeyFromBody(), getActiveScopeKey(), getAllKnownArtists(), getEffectiveSongArtist(), getEffectiveSongKey(), getExpandedSetlistItemsWithLit(), getFilteredSongsForCurrentView(), getSongFlag() (+22 more)

### Community 4 - "Project & Build Configuration"
Cohesion: 0.08
Nodes (23): config, author, dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor-firebase/authentication (+15 more)

### Community 5 - "Lyric Parsing & Liturgical Tags"
Cohesion: 0.15
Nodes (22): classifyLine(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow(), iconPeopleGroup(), iconPriestCross(), isMelodyNoteLine() (+14 more)

### Community 6 - "Song List & Dialogue Views"
Cohesion: 0.14
Nodes (17): buildSongListRowsHtml(), findMassPartCue(), getCurrentViewSectionTitle(), getLiturgicalDialogueSongs(), getMassPartCueKey(), getOrderedSongSections(), iconStar(), isSeededDefaultSong() (+9 more)

### Community 7 - "Local Storage & IndexedDB Adapter"
Cohesion: 0.16
Nodes (14): _col(), get(), getArtists(), getCategories(), getCueChords(), getCustomCues(), getDeletedSongKeys(), getFolderColors() (+6 more)

### Community 9 - "Chord Fingerings & Fretboards"
Cohesion: 0.22
Nodes (10): chordTones(), extractChordsFromBody(), getGuitarShape(), noteIndex(), parseChord(), parseChordToken(), shapeQuality(), spellNote() (+2 more)

### Community 10 - "Web App Manifest & PWA"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 12 - "Database State Hydration & Migration"
Cohesion: 0.28
Nodes (9): ensureCollectInPsalmCue(), ensureGreatAmenMigration(), getLastSyncAt(), hydrateInitialState(), loadAll(), normalizeSetlist(), persistMigratedChordSongs(), setLastSyncAt() (+1 more)

### Community 14 - "Song & Setlist Store Queries"
Cohesion: 0.29
Nodes (7): getAll(), getAllSetlists(), getAllSongs(), getSetlist(), getSong(), listSetlists(), listSongs()

### Community 15 - "Architecture & Service Blueprints"
Cohesion: 0.33
Nodes (6): Choir Book Pro Architecture Blueprint, Information Architecture & Navigation, Offline-First Storage Engine, Google Auth & One-Tap Integration Guide, Choir Book Pro Improvements & Changelog, Liturgical Mass Order & Cues Structure

### Community 16 - "Authentication & Firebase Adapter"
Cohesion: 0.40
Nodes (5): getCanonicalUserDocId(), renderAuthView(), seedIfEmpty(), selectAdapter(), subscribeRealtimeSync()

### Community 18 - "Web Shell & Brand Assets"
Cohesion: 0.67
Nodes (3): Application Icon & Splash Branding Assets, Web Application Shell Entrypoint, Development & Capacitor Setup Instructions

### Community 19 - "Store Deletion Handlers"
Cohesion: 0.67
Nodes (3): delete(), deleteSetlist(), deleteSong()

## Knowledge Gaps
- **11 isolated node(s):** `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `Information Architecture & Navigation` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 69 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Music Theory & Metadata` to `Folder Themes & Organization`, `Song Viewer & Cue Overlays`, `Music Visualizer & Setlists`, `Lyric Parsing & Liturgical Tags`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Folder Themes & Organization` be split into smaller, more focused modules?**
  _Cohesion score 0.1229260935143288 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Song Viewer & Cue Overlays` to `Folder Themes & Organization`, `Music Visualizer & Setlists`, `Music Theory & Metadata`, `Lyric Parsing & Liturgical Tags`, `Song List & Dialogue Views`, `Chord Fingerings & Fretboards`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `Song Viewer & Cue Overlays` be split into smaller, more focused modules?**
  _Cohesion score 0.07807807807807808 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Folder Themes & Organization` to `Song Viewer & Cue Overlays`, `Music Visualizer & Setlists`, `Music Theory & Metadata`, `Lyric Parsing & Liturgical Tags`, `Song List & Dialogue Views`, `Chord Fingerings & Fretboards`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `Music Visualizer & Setlists` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._