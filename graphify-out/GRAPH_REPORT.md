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
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 13
- Community 14
- Community 15
- Community 16

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

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (53): closeEditorOverlay(), _col(), currentSong(), delete(), deleteSetlist(), deleteSong(), get(), getAll() (+45 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (39): buildFretboardSVG(), buildKeyboardSVG(), buildSongListRowsHtml(), chordTones(), currentSetlist(), getActiveScopeKey(), getCurrentViewSectionTitle(), getEffectiveSongArtist() (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (28): autoAssignFoldersByTitle(), autoOrganizeAllSongsByTitle(), downloadGSMA(), findMassPartCue(), generateGSMA(), getMassPartCueKey(), iconMenu(), iconPalette() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (23): cleanSongTitleForDisplay(), detectKeyFromBody(), getEffectiveSongKey(), getFilteredSongsForCurrentView(), getLiturgicalDialogueSongs(), getOrderedSongSections(), getSongFlag(), getSongFlagRank() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (20): classifyLine(), escapeHtml(), extractPriestData(), extractResponseData(), iconCueHide(), iconCueShow(), iconPeopleGroup(), iconPriestCross() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (17): applyFolderTheme(), ensureGreatAmenMigration(), getFolderTheme(), hydrateInitialState(), iconBack(), iconSetlist(), loadAll(), normalizeSetlist() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (6): extractChordsFromBody(), inferMassPartFromGsmaTitle(), isRealChordToken(), normalizeBodyChordLines(), parseGSMA(), tokenLooksLikeChord()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (3): Choir Book Pro Design Plan, Choir Book Pro Improvements & History, Catholic Mass Flow Order & Liturgical Dialogues

## Knowledge Gaps
- **7 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `Choir Book Pro Design Plan`, `Choir Book Pro Improvements & History` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderEditor()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.058384547848990345 - nodes in this community are weakly interconnected._
- **Why does `renderViewer()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._
- **Why does `renderListView()` connect `Community 2` to `Community 0`, `Community 1`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._