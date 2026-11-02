# Graph Report - Choir Book Pro  (2026-11-03)

## Corpus Check
- 55 files · ~104,566 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .xml 10, (none) 3, .bat 3)

## Summary
- 238 nodes · 522 edges · 20 communities (7 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Module 0: app.js, buildSongListRowsHtml()
- Module 1: currentSong(), escapeHtml()
- Module 2: buildFretboardSVG(), buildKeyboardSVG()
- Module 3: applyFolderTheme(), downloadGSMA()
- Module 4: package.json, author
- Module 5: activity, GoogleOneTapPlugin.java
- Module 6: ExampleInstrumentedTest.java, ExampleInstrumentedTest
- Module 7: manifest.json, background_color
- Module 8: classifyLine(), inferMassPartFromGsmaTitle()
- Module 9: MainActivity.java, MainActivity
- Module 11: js/sw.js, SHELL_FILES
- Module 12: sw.js, SHELL_FILES

## God Nodes (most connected - your core abstractions)
1. `renderViewer()` - 44 edges
2. `renderListView()` - 29 edges
3. `escapeHtml()` - 22 edges
4. `modalHtml()` - 22 edges
5. `wireModal()` - 19 edges
6. `renderSetlistEditor()` - 17 edges
7. `render()` - 13 edges
8. `sidebarHtml()` - 13 edges
9. `get()` - 12 edges
10. `renderEditor()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `renderCuePianoFinder()` --calls--> `spellNote()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 2 → community 1_
- `transposeBody()` --calls--> `transposeToken()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 2 → community 8_
- `renderSongRowHtml()` --calls--> `transposeKeyLabel()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 2 → community 0_
- `normalizeSong()` --calls--> `normalizeBodyChordLines()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 8 → community 3_
- `renderViewer()` --calls--> `classifyLine()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 8 → community 1_

## Import Cycles
- None detected.

## Communities (20 total, 13 thin omitted)

### Community 0 - "Module 0: app.js, buildSongListRowsHtml()"
Cohesion: 0.07
Nodes (41): buildSongListRowsHtml(), _col(), delete(), deleteSetlist(), deleteSong(), findMassPartCue(), get(), getActiveScopeKey() (+33 more)

### Community 1 - "Module 1: currentSong(), escapeHtml()"
Cohesion: 0.09
Nodes (37): currentSong(), escapeHtml(), getCueKeyIdx(), getCueNoteMode(), getCueSemis(), iconBigTriangleDown(), iconBigTriangleUp(), iconChevronLeft() (+29 more)

### Community 2 - "Module 2: buildFretboardSVG(), buildKeyboardSVG()"
Cohesion: 0.09
Nodes (32): buildFretboardSVG(), buildKeyboardSVG(), chordTones(), closeEditorOverlay(), currentSetlist(), getGuitarShape(), iconArrowDown(), iconArrowUp() (+24 more)

### Community 3 - "Module 3: applyFolderTheme(), downloadGSMA()"
Cohesion: 0.13
Nodes (28): applyFolderTheme(), downloadGSMA(), generateGSMA(), getFolderTheme(), iconCheck(), iconMenu(), iconPalette(), loadAll() (+20 more)

### Community 4 - "Module 4: package.json, author"
Cohesion: 0.11
Nodes (18): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, description, keywords, license (+10 more)

### Community 7 - "Module 7: manifest.json, background_color"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 8 - "Module 8: classifyLine(), inferMassPartFromGsmaTitle()"
Cohesion: 0.32
Nodes (8): classifyLine(), inferMassPartFromGsmaTitle(), isMelodyNoteLine(), isRealChordToken(), normalizeBodyChordLines(), parseGSMA(), tokenLooksLikeChord(), transposeBody()

## Knowledge Gaps
- **3 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 57 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderViewer()` connect `Module 1: currentSong(), escapeHtml()` to `Module 0: app.js, buildSongListRowsHtml()`, `Module 8: classifyLine(), inferMassPartFromGsmaTitle()`, `Module 2: buildFretboardSVG(), buildKeyboardSVG()`, `Module 3: applyFolderTheme(), downloadGSMA()`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module 0: app.js, buildSongListRowsHtml()` be split into smaller, more focused modules?**
  _Cohesion score 0.07111756168359942 - nodes in this community are weakly interconnected._
- **Why does `renderListView()` connect `Module 3: applyFolderTheme(), downloadGSMA()` to `Module 0: app.js, buildSongListRowsHtml()`, `Module 1: currentSong(), escapeHtml()`, `Module 2: buildFretboardSVG(), buildKeyboardSVG()`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Module 1: currentSong(), escapeHtml()` be split into smaller, more focused modules?**
  _Cohesion score 0.09309309309309309 - nodes in this community are weakly interconnected._
- **Why does `modalHtml()` connect `Module 2: buildFretboardSVG(), buildKeyboardSVG()` to `Module 0: app.js, buildSongListRowsHtml()`, `Module 1: currentSong(), escapeHtml()`, `Module 3: applyFolderTheme(), downloadGSMA()`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Should `Module 2: buildFretboardSVG(), buildKeyboardSVG()` be split into smaller, more focused modules?**
  _Cohesion score 0.09475806451612903 - nodes in this community are weakly interconnected._