# Graph Report - Choir Book Pro  (2026-11-20)

## Corpus Check
- 72 files · ~133,543 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 346 nodes · 913 edges · 30 communities (15 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Setlists, Trash & GSMA
- Liturgical Cues & Key Detection
- Piano Sampler & Cue Controls
- Lyrics Parser & PPT Slides
- Capacitor & Package Config
- Core App & PPT Mode
- Liturgical Cues & Key Detection
- _col()
- Song List & Filtering UI
- Android Unit & Instrumented Tests
- Core App & PPT Mode
- PWA Web App Manifest
- Android Google One-Tap Plugin
- Android MainActivity Bridge
- getAll()
- Architecture & Mass Flow Docs
- PWA Entry & External SDKs
- delete()
- Service Worker Offline Cache
- Service Worker Offline Cache
- App Launcher & Splash Icons

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 54 edges
2. `wireModal()` - 45 edges
3. `renderListView()` - 43 edges
4. `modalHtml()` - 35 edges
5. `renderEditor()` - 33 edges
6. `escapeHtml()` - 31 edges
7. `renderSetlistEditor()` - 28 edges
8. `render()` - 23 edges
9. `renderSongSheetContent()` - 23 edges
10. `get()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Google Auth & One-Tap Integration Guide` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  GOOGLE_AUTH_SETUP.md → DESIGN_PLAN.md
- `Liturgical Mass Order & Cues Structure` --conceptually_related_to--> `Choir Book Pro Architecture Blueprint`  [INFERRED]
  Mass-Flow.md → DESIGN_PLAN.md
- `Choir Book Pro Improvements & Changelog` --references--> `Choir Book Pro Architecture Blueprint`  [EXTRACTED]
  IMPROVEMENTS.md → DESIGN_PLAN.md
- `Development & Capacitor Setup Instructions` --references--> `My Songbook PWA Entry (index.html)`  [EXTRACTED]
  SETUP_INSTRUCTIONS.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Choir Book Documentation & Architecture Suite** — design_plan_architecture_blueprint, google_auth_setup_guide, improvements_changelog, mass_flow_liturgy_structure, setup_instructions_dev_guide [EXTRACTED 1.00]

## Communities (30 total, 15 thin omitted)

### Community 0 - "Setlists, Trash & GSMA"
Cohesion: 0.08
Nodes (65): autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), closeActiveModal(), closeEditorOverlay(), currentSetlist(), deleteFromTrashForever(), downloadGSMA(), emptyTrashForever() (+57 more)

### Community 1 - "Liturgical Cues & Key Detection"
Cohesion: 0.08
Nodes (42): buildFretboardSVG(), buildKeyboardSVG(), chordTones(), detectKeyFromBody(), extractChordsFromBody(), formatRelativeTime(), getAllKnownArtists(), getEffectiveSongArtist() (+34 more)

### Community 2 - "Piano Sampler & Cue Controls"
Cohesion: 0.10
Nodes (28): currentSong(), ensurePianoAudioBus(), getCueAccidentalsPref(), getCueKeyIdx(), getCueNoteMode(), getCueSemis(), handleStaffPlayClick(), iconBigTriangleDown() (+20 more)

### Community 3 - "Lyrics Parser & PPT Slides"
Cohesion: 0.15
Nodes (27): buildPptSlides(), classifyLine(), cleanSongTitleForDisplay(), escapeHtml(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow() (+19 more)

### Community 4 - "Capacitor & Package Config"
Cohesion: 0.08
Nodes (23): config, author, dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor-firebase/authentication (+15 more)

### Community 5 - "Core App & PPT Mode"
Cohesion: 0.09
Nodes (5): getCueChordMap(), getCueChordText(), saveCueChordText(), setScreenKeepAwake(), syncWakeLock()

### Community 6 - "Liturgical Cues & Key Detection"
Cohesion: 0.16
Nodes (17): applyFolderTheme(), ensureCollectInPsalmCue(), ensureGreatAmenMigration(), findMassPartCue(), getLastSyncAt(), getMassPartCueKey(), hydrateInitialState(), loadAll() (+9 more)

### Community 7 - "_col()"
Cohesion: 0.14
Nodes (16): _col(), get(), getArtists(), getCanonicalUserDocId(), getCategories(), getCueChords(), getCustomCues(), getDeletedSongKeys() (+8 more)

### Community 8 - "Song List & Filtering UI"
Cohesion: 0.16
Nodes (14): buildSongListRowsHtml(), getActiveScopeKey(), getCurrentViewSectionTitle(), getExpandedSetlistItemsWithLit(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getViewerSongList() (+6 more)

### Community 10 - "Core App & PPT Mode"
Cohesion: 0.21
Nodes (12): acquirePptWakeLock(), buildPptSectionAnchors(), getDefaultPptZoom(), getPptZoomPercent(), iconChevronLeft(), iconChevronRight(), pptBlankIcon(), pptFullscreenIcon() (+4 more)

### Community 11 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getAll()"
Cohesion: 0.29
Nodes (7): getAll(), getAllSetlists(), getAllSongs(), getSetlist(), getSong(), listSetlists(), listSongs()

### Community 15 - "Architecture & Mass Flow Docs"
Cohesion: 0.33
Nodes (6): Choir Book Pro Architecture Blueprint, Information Architecture & Navigation, Offline-First Storage Engine, Google Auth & One-Tap Integration Guide, Choir Book Pro Improvements & Changelog, Liturgical Mass Order & Cues Structure

### Community 17 - "PWA Entry & External SDKs"
Cohesion: 0.50
Nodes (4): Firebase Compat SDK & Google One Tap GIS, Google Fonts (Manrope, Montserrat, JetBrains Mono), My Songbook PWA Entry (index.html), Development & Capacitor Setup Instructions

### Community 18 - "delete()"
Cohesion: 0.67
Nodes (3): delete(), deleteSetlist(), deleteSong()

## Knowledge Gaps
- **13 isolated node(s):** `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `Information Architecture & Navigation` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 73 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Liturgical Cues & Key Detection` to `Setlists, Trash & GSMA`, `Song List & Filtering UI`, `Lyrics Parser & PPT Slides`, `Core App & PPT Mode`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `@capacitor-firebase/authentication`, `@capacitor/android`, `@capacitor/app` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Setlists, Trash & GSMA` be split into smaller, more focused modules?**
  _Cohesion score 0.0764423076923077 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Piano Sampler & Cue Controls` to `Setlists, Trash & GSMA`, `Liturgical Cues & Key Detection`, `Lyrics Parser & PPT Slides`, `Core App & PPT Mode`, `Song List & Filtering UI`, `Core App & PPT Mode`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `Liturgical Cues & Key Detection` be split into smaller, more focused modules?**
  _Cohesion score 0.07549361207897794 - nodes in this community are weakly interconnected._
- **Why does `wireModal()` connect `Setlists, Trash & GSMA` to `Liturgical Cues & Key Detection`, `Piano Sampler & Cue Controls`, `Lyrics Parser & PPT Slides`, `Core App & PPT Mode`, `Liturgical Cues & Key Detection`, `Song List & Filtering UI`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `Piano Sampler & Cue Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._