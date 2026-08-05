(function(){
"use strict";

/* ============================================================
   MUSIC THEORY CONSTANTS
   ============================================================ */
const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm']);

const QUALITY_INTERVALS = {
  '':[0,4,7], 'maj':[0,4,7], 'M':[0,4,7],
  'm':[0,3,7], 'min':[0,3,7],
  '7':[0,4,7,10], 'maj7':[0,4,7,11], 'maj9':[0,4,7,11,2],
  'm7':[0,3,7,10], 'min7':[0,3,7,10], 'm7b5':[0,3,6,10],
  'dim':[0,3,6], 'dim7':[0,3,6,9], 'aug':[0,4,8],
  'sus2':[0,2,7], 'sus4':[0,5,7],
  '6':[0,4,7,9], 'm6':[0,3,7,9],
  '9':[0,4,7,10,2], 'add9':[0,4,7,2], '11':[0,4,7,10,2,5], '13':[0,4,7,10,2,9]
};

const CHORD_RE = /^([A-G])(#|b)?(maj9|maj7|maj|min7|min|m7b5|dim7|dim|sus2|sus4|aug|add9|m6|m7|m|6|7|9|11|13)?(\/([A-G])(#|b)?)?$/;

function noteIndex(letter, acc){
  let i = NOTES_SHARP.indexOf(letter);
  if(acc === '#') i = (i+1)%12;
  if(acc === 'b') i = (i-1+12)%12;
  return i;
}
function parseChord(token){
  const m = CHORD_RE.exec(token);
  if(!m) return null;
  return { root: m[1], acc: m[2]||'', quality: m[3]||'', bassRoot: m[5]||null, bassAcc: m[6]||'' };
}
function spellNote(idx, preferFlat){
  return (preferFlat ? NOTES_FLAT : NOTES_SHARP)[(idx%12+12)%12];
}
function transposeToken(token, semis, preferFlat){
  const c = parseChord(token);
  if(!c) return token;
  const newRootIdx = (noteIndex(c.root,c.acc) + semis + 120) % 12;
  let out = spellNote(newRootIdx, preferFlat) + c.quality;
  if(c.bassRoot){
    const newBassIdx = (noteIndex(c.bassRoot,c.bassAcc) + semis + 120)%12;
    out += '/' + spellNote(newBassIdx, preferFlat);
  }
  return out;
}
function transposeKeyLabel(key, semis){
  if(!key) return key;
  const minor = /m$/i.test(key.trim()) && !/maj/i.test(key);
  const base = key.replace(/m$/i,'');
  const m = /^([A-G])(#|b)?/.exec(base);
  if(!m) return key;
  const preferFlat = FLAT_KEYS.has(key);
  const idx = (noteIndex(m[1], m[2]||'') + semis + 120)%12;
  return spellNote(idx, preferFlat) + (minor ? 'm' : '');
}

/* Guitar shapes: base = frets for [str6(low E),str5,str4,str3,str2,str1(high E)], 'x' = muted, unshifted position = fret0 */
const SHAPE_E = {
  '':[0,2,2,1,0,0], 'm':[0,2,2,0,0,0], '7':[0,2,0,1,0,0], 'maj7':[0,2,1,1,0,0], 'm7':[0,2,0,0,0,0],
  'sus4':[0,2,2,2,0,0], 'sus2':[0,2,4,4,0,0], 'dim':[0,1,2,0,0,0], '6':[0,2,2,1,2,0], 'aug':[0,3,2,1,0,0]
};
const SHAPE_A = {
  '':['x',0,2,2,2,0], 'm':['x',0,2,2,1,0], '7':['x',0,2,0,2,0], 'maj7':['x',0,2,1,2,0], 'm7':['x',0,2,0,1,0],
  'sus4':['x',0,2,2,3,0], 'sus2':['x',0,2,2,0,0], 'dim':['x',0,1,2,1,'x'], '6':['x',0,2,2,2,2], 'aug':['x',0,3,2,1,'x']
};
const QUALITY_FALLBACK = {
  'M':'', 'maj':'', 'min':'m', 'min7':'m7', 'm7b5':'dim', 'dim7':'dim', 'maj9':'maj7',
  '9':'7', 'add9':'', 'm6':'m', '11':'7', '13':'7'
};
function shapeQuality(q){
  if(SHAPE_E[q]!==undefined) return q;
  if(QUALITY_FALLBACK[q]!==undefined) return QUALITY_FALLBACK[q];
  return '';
}
function getGuitarShape(root, acc, quality){
  const rootIdx = noteIndex(root, acc);
  const q = shapeQuality(quality);
  const offE = (rootIdx - 4 + 12) % 12;
  const offA = (rootIdx - 9 + 12) % 12;
  let base, offset;
  if(offE <= offA){ base = SHAPE_E[q]; offset = offE; }
  else { base = SHAPE_A[q]; offset = offA; }
  const frets = base.map(f => f==='x' ? 'x' : f + offset);
  return { frets, offset };
}
function chordTones(root, acc, quality){
  const rootIdx = noteIndex(root, acc);
  const intervals = QUALITY_INTERVALS[quality] !== undefined ? QUALITY_INTERVALS[quality] : QUALITY_INTERVALS[''];
  return intervals.map(iv => (rootIdx+iv)%12);
}

/* ============================================================
   SVG DIAGRAM BUILDERS
   ============================================================ */
function buildFretboardSVG(frets, offset){
  const W=260, H=280, left=30, right=W-20, top=40, bottom=H-30;
  const stringGap = (right-left)/5;
  const numFretsShown = 4;
  const fretGap = (bottom-top)/numFretsShown;
  let s = `<svg class="fretboard" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  for(let i=0;i<6;i++){
    const x = left + i*stringGap;
    s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="var(--text-dim)" stroke-width="1.4"/>`;
  }
  for(let f=0; f<=numFretsShown; f++){
    const y = top + f*fretGap;
    s += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="var(--line)" stroke-width="${f===0 && offset===0 ? 3 : 1.4}"/>`;
  }
  const romans = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  if(offset>0){
    s += `<text x="${left-18}" y="${top+fretGap*0.7}" font-size="12" fill="var(--text-dim)" font-family="Manrope">${romans[offset]||offset}</text>`;
  }
  const frettedNow = frets.filter(f=>f!=='x');
  const minFret = Math.min(...frettedNow);
  if(offset>0 && frets.filter(f=>f===offset).length>=2){
    const idxs = frets.map((f,i)=>f===offset?i:-1).filter(i=>i>=0);
    const x1 = left + Math.min(...idxs)*stringGap, x2 = left + Math.max(...idxs)*stringGap;
    const y = top + ((offset-minFret)+0.5)*fretGap;
    s += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--chord)" stroke-width="10" stroke-linecap="round" opacity="0.85"/>`;
  }
  frets.forEach((f,i)=>{
    const x = left + i*stringGap;
    if(f==='x'){
      s += `<text x="${x}" y="${top-14}" font-size="14" fill="var(--text-dim)" text-anchor="middle" font-family="Manrope">&#215;</text>`;
    } else if(f===0){
      s += `<circle cx="${x}" cy="${top-16}" r="5" fill="none" stroke="var(--text-dim)" stroke-width="1.5"/>`;
    } else {
      const rel = f - minFret;
      const y = top + (rel+0.5)*fretGap;
      s += `<circle cx="${x}" cy="${y}" r="9" fill="var(--chord)"/>`;
    }
  });
  s += `</svg>`;
  return s;
}
function buildKeyboardSVG(tones, rootIdx){
  const whiteOrder = [0,2,4,5,7,9,11];
  const blackAfter = {0:1,2:3,5:6,7:8,9:10};
  const W=280,H=140, wKeyW = W/7, wKeyH=H, bKeyW=wKeyW*0.6, bKeyH=H*0.6;
  let s = `<svg class="keyboard" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  whiteOrder.forEach((note,i)=>{
    const x = i*wKeyW;
    const active = tones.includes(note);
    const isRoot = note===rootIdx;
    const fill = isRoot ? 'var(--chord)' : (active ? 'var(--accent-dim)' : '#f3f0ea');
    s += `<rect x="${x}" y="0" width="${wKeyW}" height="${wKeyH}" fill="${fill}" stroke="var(--line)" stroke-width="1"/>`;
  });
  whiteOrder.forEach((note,i)=>{
    if(blackAfter[note]!==undefined){
      const bNote = blackAfter[note];
      const x = (i+1)*wKeyW - bKeyW/2;
      const active = tones.includes(bNote);
      const isRoot = bNote===rootIdx;
      const fill = isRoot ? 'var(--chord)' : (active ? 'var(--accent)' : '#1c1c1c');
      s += `<rect x="${x}" y="0" width="${bKeyW}" height="${bKeyH}" fill="${fill}" stroke="#000" stroke-width="1"/>`;
    }
  });
  s += `</svg>`;
  return s;
}

/* ============================================================
   CHORD-SHEET PARSING (chord line directly above lyric line)
   ============================================================ */
function tokenLooksLikeChord(tok){
  return CHORD_RE.test(tok) || tok==='N.C.' || tok==='%';
}
function classifyLine(line){
  const trimmed = line.trim();
  if(trimmed==='') return 'blank';
  if(/^[=\-_]{4,}$/.test(trimmed)) return 'divider';
  if(/^(Priest|Presider|Celebrant)\b\s*:?\s*/i.test(trimmed)) return 'priest';
  if(/^(Response|People|All)\b\s*:?\s*/i.test(trimmed)) return 'response';
  if(/^\[.+\]$/.test(trimmed)) return 'section'; // generic [Anything] bracket header, e.g. from .gsma imports
  if(/^(Intro|Verse|Chorus|Bridge|Outro|Pre-Chorus|Interlude|Ending|Refrain)[\s:0-9IVX]*$/i.test(trimmed)) return 'section';
  if(/^<.+>$/.test(trimmed)) return 'bracket';
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if(tokens.length===0) return 'lyric';
  const chordish = tokens.filter(tokenLooksLikeChord).length;
  if(chordish / tokens.length >= 0.6) return 'chord';
  return 'lyric';
}
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function renderChordLine(line){
  const re = /(\S+)/g;
  let last = 0, out = '';
  let m;
  while((m = re.exec(line))){
    out += escapeHtml(line.slice(last, m.index));
    const tok = m[1];
    if(tokenLooksLikeChord(tok) && tok!=='N.C.' && tok!=='%'){
      out += `<span class="chord-tok" data-chord="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`;
    } else {
      out += escapeHtml(tok);
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(line.slice(last));
  return out;
}
/* Renders lines like "<G D Em C>" or "> G D Em C" — every chord inside the
   bracket shown in the chord color, brackets themselves shown dim. */
function renderBracketLine(line){
  const s = line.indexOf('<'), e = line.lastIndexOf('>');
  if(s<0 || e<0 || e<=s) return renderChordLine(line);
  const before = line.slice(0,s), inner = line.slice(s+1,e), after = line.slice(e+1);
  const innerRendered = inner.replace(/(\S+)/g, tok => `<span class="chord-tok" data-chord="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`);
  return escapeHtml(before) + '<span class="bracket-tok">&lt;</span>' + innerRendered + '<span class="bracket-tok">&gt;</span>' + escapeHtml(after);
}
function transposeBody(body, semis, preferFlat){
  return body.split('\n').map(line=>{
    const cls = classifyLine(line);
    if(cls==='chord'){
      return line.replace(/(\S+)/g, tok => tokenLooksLikeChord(tok) && tok!=='N.C.' && tok!=='%' ? transposeToken(tok, semis, preferFlat) : tok);
    }
    if(cls==='bracket'){
      const s = line.indexOf('<'), e = line.lastIndexOf('>');
      if(s<0||e<0||e<=s) return line;
      const inner = line.slice(s+1,e);
      const transposedInner = inner.replace(/(\S+)/g, tok => tokenLooksLikeChord(tok) ? transposeToken(tok, semis, preferFlat) : tok);
      return line.slice(0,s+1) + transposedInner + line.slice(e);
    }
    return line;
  }).join('\n');
}

/* ============================================================
   STORAGE LAYER — Claude sync storage when available,
   localStorage fallback everywhere else (Capacitor / plain browser)
   ============================================================ */
const HAS_CLAUDE_STORAGE = (typeof window !== 'undefined' && !!window.storage);
const FIREBASE_READY = (typeof firebase !== 'undefined' && !!window.__FIREBASE_CONFIGURED__);
let firebaseUser = null;

// (2026-07-13) batch getAll for instant load & local cache mirroring; prev: single get
const LocalAdapter = {
  async list(prefix){
    const out = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(prefix)) out.push(k);
    }
    return out;
  },
  async get(key){
    const v = localStorage.getItem(key);
    return v===null ? null : {key, value:v};
  },
  async getAll(prefix){
    const out = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(prefix)){
        const v = localStorage.getItem(k);
        if(v!==null) out.push({key:k, value:v});
      }
    }
    return out;
  },
  async set(key, value){
    localStorage.setItem(key, value);
    return {key, value};
  },
  async delete(key){
    localStorage.removeItem(key);
    return {key, deleted:true};
  }
};

const ClaudeAdapter = {
  async list(prefix){
    try{ const r = await window.storage.list(prefix, false); return r ? r.keys : []; }
    catch(e){ return []; }
  },
  async get(key){
    try{ return await window.storage.get(key, false); }
    catch(e){ return null; }
  },
  async getAll(prefix){
    try{
      const keys = await this.list(prefix);
      const out = [];
      for(const k of keys){
        const v = await this.get(k);
        if(v) out.push(v);
      }
      return out;
    }catch(e){ return []; }
  },
  async set(key, value){
    return await window.storage.set(key, value, false);
  },
  async delete(key){
    try{ return await window.storage.delete(key, false); }catch(e){ return null; }
  }
};

// (2026-07-13) optimize FirestoreAdapter to query collection without index hangs; prev: documentId range query
const FirestoreAdapter = {
  _col(){
    return firebase.firestore().collection('users').doc(firebaseUser.uid).collection('data');
  },
  async list(prefix){
    try{
      const snap = await this._col().get();
      return snap.docs.map(d=>d.id).filter(id=>id.startsWith(prefix));
    }catch(e){ console.error('Firestore list failed', e); return LocalAdapter.list(prefix); }
  },
  async get(key){
    try{
      const doc = await this._col().doc(key).get();
      if(!doc.exists) return LocalAdapter.get(key);
      return {key, value: doc.data().value};
    }catch(e){ console.error('Firestore get failed', e); return LocalAdapter.get(key); }
  },
  async getAll(prefix){
    try{
      const snap = await this._col().get();
      const docs = snap.docs
        .filter(d => d.id.startsWith(prefix))
        .map(d => ({ key: d.id, value: d.data().value }));
      docs.forEach(item => LocalAdapter.set(item.key, item.value));
      return docs;
    }catch(e){
      console.error('Firestore batch getAll failed', e);
      return LocalAdapter.getAll(prefix);
    }
  },
  async set(key, value){
    LocalAdapter.set(key, value);
    try{ await this._col().doc(key).set({value, updatedAt: Date.now()}); }
    catch(e){ console.error('Firestore set failed', e); }
    return {key, value};
  },
  async delete(key){
    LocalAdapter.delete(key);
    try{ await this._col().doc(key).delete(); }catch(e){}
    return {key, deleted:true};
  }
};

let adapter = HAS_CLAUDE_STORAGE ? ClaudeAdapter : LocalAdapter;
function selectAdapter(){
  if(FIREBASE_READY && firebaseUser) adapter = FirestoreAdapter;
  else if(HAS_CLAUDE_STORAGE) adapter = ClaudeAdapter;
  else adapter = LocalAdapter;
}

const Store = {
  get mode(){
    if(FIREBASE_READY && firebaseUser) return 'firebase';
    return HAS_CLAUDE_STORAGE ? 'synced' : 'local';
  },
  async listSongs(){ return adapter.list('song:'); },
  async getSong(key){
    const r = await adapter.get(key);
    if(!r) return null;
    try{ return JSON.parse(r.value); }catch(e){ return null; }
  },
  async getAllSongs(){
    if(adapter.getAll){
      const items = await adapter.getAll('song:');
      return items.map(it => {
        try{ return JSON.parse(it.value); }catch(e){ return null; }
      }).filter(Boolean);
    }
    const keys = await this.listSongs();
    const songs = [];
    for(const k of keys){
      const s = await this.getSong(k);
      if(s) songs.push(s);
    }
    return songs;
  },
  async saveSong(song){
    await adapter.set('song:'+song.id, JSON.stringify(song));
  },
  async deleteSong(id){ await adapter.delete('song:'+id); },
  async getCategories(){
    const r = await adapter.get('meta:categories');
    if(!r) return ['Uncategorized'];
    try{ return JSON.parse(r.value); }catch(e){ return ['Uncategorized']; }
  },
  async saveCategories(cats){ await adapter.set('meta:categories', JSON.stringify(cats)); },
  async getMassParts(){
    const r = await adapter.get('meta:massparts');
    if(!r) return null;
    try{ return JSON.parse(r.value); }catch(e){ return null; }
  },
  async saveMassParts(parts){ await adapter.set('meta:massparts', JSON.stringify(parts)); },
  async listSetlists(){ return adapter.list('setlist:'); },
  async getSetlist(key){
    const r = await adapter.get(key);
    if(!r) return null;
    try{ return JSON.parse(r.value); }catch(e){ return null; }
  },
  async getAllSetlists(){
    if(adapter.getAll){
      const items = await adapter.getAll('setlist:');
      return items.map(it => {
        try{ return JSON.parse(it.value); }catch(e){ return null; }
      }).filter(Boolean);
    }
    const keys = await this.listSetlists();
    const setlists = [];
    for(const k of keys){
      const sl = await this.getSetlist(k);
      if(sl) setlists.push(sl);
    }
    return setlists;
  },
  async saveSetlist(setlist){ await adapter.set('setlist:'+setlist.id, JSON.stringify(setlist)); },
  async deleteSetlist(id){ await adapter.delete('setlist:'+id); }
};
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

const DEFAULT_MASS_PARTS = ['Entrance','Kyrie','Gloria','Responsorial Psalm','Gospel Acclamation',
  'Offertory','Sanctus','Memorial Acclamation','Our Father','Lamb of God','Communion','Recessional','Other'];

/* ============================================================
   APP STATE
   ============================================================ */
const state = {
  view: 'list', // list | viewer | editor | auth
  skippedAuth: false,
  songs: [],
  categories: ['Uncategorized'],
  massParts: DEFAULT_MASS_PARTS.slice(),
  loading: true,
  authChecked: false,
  search: '',
  sortBy: 'title',
  filterCat: 'All',
  filterMassPart: null, // when set, list view is browsing by mass part instead of folder
  sidebarOpen: false,
  currentId: null,
  editingDraft: null,
  // (2026-07-13) default autoscroll to on; prev: autoscroll: false
  autoscroll: true,
  metronomeOn: false,
  modal: null,
  longPressTimer: null,
  setlists: [],
  currentSetlistId: null,
  editingSetlistDraft: null,
  cameFromSetlistId: null // when set, the song viewer's back button returns to this setlist instead of the main list
};

let scrollTimer = null;
let metroCtx = null, metroTimer = null, metroBeat = 0;
let resumeScrollTimer = null;

function normalizeSong(song){
  if(!song.categories){
    song.categories = song.category ? [song.category] : [];
    delete song.category;
  }
  if(!song.massParts) song.massParts = [];
  if(!song.timeSig) song.timeSig = '4/4';
  if(song.viewerFontSize===undefined) song.viewerFontSize = 15;
  if(song.viewerScrollSpeed===undefined) song.viewerScrollSpeed = 30;
  if(song.referenceUrl===undefined) song.referenceUrl = '';
  if(song.importedGuid===undefined) song.importedGuid = null;
  return song;
}

// (2026-07-13) instant load from local cache with timeout protection; prev: un-timed network wait
async function loadAll(){
  try{
    const cachedItems = await LocalAdapter.getAll('song:');
    if(cachedItems && cachedItems.length > 0){
      state.songs = cachedItems.map(it=>{
        try{ return normalizeSong(JSON.parse(it.value)); }catch(e){ return null; }
      }).filter(Boolean);
      state.categories = await Store.getCategories();
      const savedParts = await Store.getMassParts();
      state.massParts = savedParts || DEFAULT_MASS_PARTS.slice();
      const cachedSetlists = await LocalAdapter.getAll('setlist:');
      state.setlists = cachedSetlists.map(it=>{
        try{ return normalizeSetlist(JSON.parse(it.value)); }catch(e){ return null; }
      }).filter(Boolean);
      state.loading = false;
      render();
    } else {
      state.loading = true; render();
    }
  }catch(e){ state.loading = true; render(); }

  try{
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
    const dataFetch = Promise.all([
      Store.getAllSongs(),
      Store.getCategories(),
      Store.getMassParts(),
      Store.getAllSetlists()
    ]);
    const [rawSongs, cats, parts, rawSetlists] = await Promise.race([dataFetch, timeout]);
    if(rawSongs && rawSongs.length > 0) state.songs = rawSongs.map(normalizeSong);
    if(cats) state.categories = cats;
    if(parts) state.massParts = parts;
    if(rawSetlists) state.setlists = rawSetlists.map(normalizeSetlist);
  }catch(err){
    console.warn('Network sync timed out or offline, using local data');
  }

  state.loading = false;
  render();
}

function normalizeSetlist(sl){
  if(!Array.isArray(sl.items)) sl.items = [];
  if(sl.isTemplate===undefined) sl.isTemplate = !sl.date;
  if(sl.date===undefined) sl.date = null;
  if(sl.basedOnTemplateId===undefined) sl.basedOnTemplateId = null;
  return sl;
}

async function seedIfEmpty(){
  const keys = await Store.listSongs();
  if(keys.length===0){
    const sample = {
      id: uid(), title: 'Amazing Grace', artist: 'Traditional', key: 'G', capo: 0, tempo: 70,
      timeSig: '3/4', style: 'Hymn', instrument: 'Guitar / Vocal', categories: ['Worship'],
      massParts: ['Communion'],
      favorite: true, transposeOffset: 0, dateAdded: Date.now(),
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`Intro:
G          C      G
G                    D
Amazing grace, how sweet the sound
G                  Em
That saved a wretch like me
G              D
I once was lost, but now am found
G          D      G
Was blind but now I see`
    };
    const sample2 = {
      id: uid(), title: 'Anima Christi', artist: 'Traditional', key: 'D', capo: 0, tempo: 70,
      timeSig: '4/4', style: 'Hymn', instrument: 'Guitar / Vocal', categories: ['Ordinary Time Songs','Lent Songs'],
      massParts: ['Offertory','Communion'],
      favorite: false, transposeOffset: 0, dateAdded: Date.now()-1000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`Verse 1
> D A G
Soul of Christ, sanctify me
> D A G
Body of Christ, save me
> A Am D7 G
Water from the side of Christ, wash me
> F#m7 Bm7 Em7 A D
Passion of Christ, give me strength.
======================================
Chorus
> Gmaj7 F#m7 Bm
Hear me Jesus, hide me in Thy wounds
> Cmaj7 A
That I may never leave Thy side.
------------------------------------
Verse 2
> D A G
For all the evil that surrounds me, defend me
> D F#m G
And when the call of death arrives
> Gmaj7 F# Em A D
Bid me come to Thee, that I may praise Thee
> F# Em-A D
Thee with Thy saints forever.
------------------------------------
Bridge
> D A G
Never let me be separated from Thee
> D F#m G
From the evil one, protect me
> Gmaj7 F# Em A D
At the hour of my death, call me
> F# Em-A D
And bid me come to Thee.
------------------------------------
Outro
> D A G D
That with all Thy saints, I may praise Thee
> D A G D
Forever and ever, forever and ever.`
    };
    await Store.saveSong(sample);
    await Store.saveSong(sample2);
    await Store.saveCategories(['Worship','Lent Songs','Ordinary Time Songs','Advent Songs','Misa de Gallo Songs','Uncategorized']);
  }
}

/* ============================================================
   RENDER
   ============================================================ */
const app = document.getElementById('app');
function render(){
  if(state.view==='auth') return renderAuthView();
  if(state.loading){
    app.innerHTML = `<div class="loading">Loading your songs&hellip;</div>`;
    return;
  }
  if(state.view==='list') return renderListView();
  if(state.view==='viewer') return renderViewer();
  if(state.view==='editor') return renderEditor();
  if(state.view==='setlists') return renderSetlistsView();
  if(state.view==='setlist-editor') return renderSetlistEditor();
}
// (2026-07-13) mandatory Google login screen without offline skip; prev: skip auth button
function renderAuthView(){
  app.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;gap:18px;">
      <div style="width:72px;height:72px;border-radius:20px;background:var(--chord);display:flex;align-items:center;justify-content:center;font-size:32px;">&#127925;</div>
      <div>
        <h1 style="font-size:22px;margin:0 0 8px;">Choir Book</h1>
        <div class="hint" style="font-size:13px;max-width:280px;line-height:1.4;">Please sign in with Google to access and save your songs, folders, and Mass plans to your account.</div>
      </div>
      <button class="btn btn-primary" id="btn-google-signin" style="flex:0 0 auto;padding:14px 32px;font-weight:600;font-size:15px;">Sign in with Google</button>
    </div>
  `;
  const btn = document.getElementById('btn-google-signin');
  if(btn){
    btn.onclick = async ()=>{
      try{
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
      }catch(e){
        try{
          const provider = new firebase.auth.GoogleAuthProvider();
          await firebase.auth().signInWithRedirect(provider);
        }catch(err){
          alert('Sign-in failed: ' + (err.message||'please try again.'));
        }
      }
    };
  }
}
function showToast(msg){
  const t = document.createElement('div');
  t.className='toast'; t.textContent=msg;
  app.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); }, 1800);
}

/* ============================================================
   .gsma / .gsm IMPORT (Guitar Songs export format)
   ============================================================
   Each song record is a block of 8 fixed metadata lines:
     author="..."; authorguid="..."; songguid="..."; system="...";
     song="..."; delay="..."; duration="..."; sender="...";
   followed by free-form body text. Chords are written inline as
   <ChordName> or <Chord1 Chord2 ...> clusters (possibly with odd
   internal spacing), not as bare space-separated tokens like our
   own chord-line convention — so those get converted on import.
   Returns { folderName, songs } — folderName comes from the
   author="" field (the songbook/collection name), songs is an
   array of ready-to-save song objects (still missing id/dateAdded,
   filled in by the caller so re-imports of the same file can be
   deduped by importedGuid before ids are assigned). */
const GSMA_MASS_PART_HINTS = DEFAULT_MASS_PARTS.map(p=>p.toLowerCase());

function parseGSMA(text){
  const blocks = text.split(/(?=^author\s*=\s*")/m).filter(b=>b.trim());
  let folderName = 'Imported';
  const songs = [];

  blocks.forEach(block=>{
    const lines = block.split(/\r?\n/);
    const header = {};
    let i = 0;
    // Parse the fixed key="value"; header lines at the top of the block.
    while(i < lines.length){
      const m = /^(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*;\s*$/.exec(lines[i]);
      if(m){ header[m[1]] = m[2]; i++; }
      else break;
    }
    if(!header.song) return; // not a valid record, skip

    if(header.author) folderName = header.author.trim() || folderName;

    let bodyLines = lines.slice(i);
    // Strip trailing blank lines and the lone "." record-terminator some exports include.
    while(bodyLines.length && (bodyLines[bodyLines.length-1].trim()==='' || bodyLines[bodyLines.length-1].trim()==='.')){
      bodyLines.pop();
    }
    let body = bodyLines.join('\n');

    // Extract "tempo 70" style lines into the tempo field.
    let tempo = null;
    const tempoMatch = /^[ \t]*tempo[ \t]+(\d+)[ \t]*$/im.exec(body);
    if(tempoMatch){
      tempo = parseInt(tempoMatch[1]) || null;
      body = body.replace(/^[ \t]*tempo[ \t]+\d+[ \t]*\n?/im, '');
    }

    // Extract "yt: https://..." reference link lines.
    let referenceUrl = '';
    const ytMatch = /^[ \t]*yt:[ \t]*(\S+)[ \t]*$/im.exec(body);
    if(ytMatch){
      referenceUrl = ytMatch[1];
      body = body.replace(/^[ \t]*yt:[ \t]*\S+[ \t]*\n?/im, '');
    }

    // If the very first non-blank body line is exactly a known Mass Part name,
    // treat it as a Mass Part tag rather than lyric/title text (seen in some
    // exports, e.g. a lone "Communion" line before the actual song title).
    let massParts = [];
    const bodyLineArr = body.split('\n');
    for(let li=0; li<bodyLineArr.length; li++){
      const t = bodyLineArr[li].trim();
      if(t===''){ continue; }
      const hitIdx = GSMA_MASS_PART_HINTS.indexOf(t.toLowerCase());
      if(hitIdx>=0){
        massParts = [DEFAULT_MASS_PARTS[hitIdx]];
        bodyLineArr.splice(li,1);
      }
      break;
    }
    body = bodyLineArr.join('\n');

    // Convert <Chord> / <Chord1 Chord2> inline bracket notation into our own
    // bare space-separated chord-line convention: insert a separating space
    // between adjacent groups ("><") before stripping every "<" and ">".
    body = body.replace(/></g, '> <').replace(/[<>]/g, '');

    // Trim leftover blank-line runs down to at most one, and outer whitespace.
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    songs.push({
      title: header.song.trim(),
      artist: '',
      key: '',
      capo: 0,
      tempo: tempo || 90,
      timeSig: '4/4',
      style: '',
      instrument: '',
      categories: [folderName],
      massParts,
      favorite: false,
      transposeOffset: 0,
      viewerFontSize: 15,
      viewerScrollSpeed: 30,
      referenceUrl,
      importedGuid: header.songguid || null,
      body
    });
  });

  return { folderName, songs };
}

function renderListView(){
  let songs = state.songs.slice();
  if(state.filterMassPart){
    songs = songs.filter(s=>(s.massParts||[]).includes(state.filterMassPart));
  } else if(state.filterCat==='Favorites'){
    songs = songs.filter(s=>s.favorite);
  } else if(state.filterCat!=='All'){
    songs = songs.filter(s=>(s.categories||[]).includes(state.filterCat));
  }
  if(state.search.trim()){
    const q = state.search.toLowerCase();
    songs = songs.filter(s => s.title.toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q));
  }

  songs.sort((a,b)=>{
    if(state.sortBy==='code'){
      const numA = parseInt((a.title.match(/^\d+/) || ['999999'])[0]);
      const numB = parseInt((b.title.match(/^\d+/) || ['999999'])[0]);
      if(numA !== numB) return numA - numB;
      return a.title.localeCompare(b.title);
    }
    if(state.sortBy==='title') return a.title.localeCompare(b.title);
    if(state.sortBy==='artist') return (a.artist||'').localeCompare(b.artist||'');
    if(state.sortBy==='date') return b.dateAdded - a.dateAdded;
    if(state.sortBy==='key') return (a.key||'').localeCompare(b.key||'');
    return 0;
  });

  let rows = '';
  let lastLetter = '';
  songs.forEach(s=>{
    const letter = (s.title[0]||'#').toUpperCase();
    const letterKey = /[A-Z]/.test(letter) ? letter : '#';
    if(state.sortBy==='title' && letterKey !== lastLetter){
      rows += `<div class="letter-divider">${letterKey}</div>`;
      lastLetter = letterKey;
    }
    rows += `
      <div class="song-row" data-id="${s.id}">
        <span class="fav" style="display:flex;align-items:center;">${s.favorite ? iconStar(true) : iconStar(false)}</span>
        <div style="flex:1;min-width:0;">
          <div class="song-title">${escapeHtml(s.title)}</div>
          <div class="song-sub">${escapeHtml(s.artist||'Unknown')} &middot; Key ${escapeHtml(transposeKeyLabel(s.key, s.transposeOffset||0)||'—')}${(s.categories&&s.categories.length)?' &middot; '+escapeHtml(s.categories.join(', ')):''}</div>
        </div>
      </div>`;
  });
  if(songs.length===0){
    rows = `<div class="empty-state">No songs here yet.<br>Tap the + button to add one, or long-press a song to file it in this ${state.filterMassPart?'Mass Part':'folder'}.</div>`;
  }

  const cats = ['All', 'Favorites', ...state.categories];
  const chips = state.filterMassPart
    ? `<div class="chip active" data-back-to-folders="1">&larr; ${escapeHtml(state.filterMassPart)}</div>`
    : cats.map(c=>`<div class="chip ${state.filterCat===c?'active':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join('');

  const headerTitle = state.filterMassPart ? escapeHtml(state.filterMassPart) : (state.filterCat==='All' ? 'My Songbook' : escapeHtml(state.filterCat));

  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="btn-open-sidebar">${iconMenu()}</button>
      <h1>${headerTitle}</h1>
      <button class="icon-btn" id="btn-manage-cats" title="Folders">${iconFolder()}</button>
    </div>
    <div class="searchrow">
      <input id="search-input" placeholder="Search title or artist…" value="${escapeHtml(state.search)}"/>
      <select id="sort-select">
        <option value="code" ${state.sortBy==='code'||!state.sortBy?'selected':''}>Code / Order</option>
        <option value="title" ${state.sortBy==='title'?'selected':''}>Title</option>
        <option value="artist" ${state.sortBy==='artist'?'selected':''}>Artist</option>
        <option value="date" ${state.sortBy==='date'?'selected':''}>Recent</option>
        <option value="key" ${state.sortBy==='key'?'selected':''}>Key</option>
      </select>
    </div>
    <div class="chiprow">${chips}</div>
    <div class="list-wrap" id="list-wrap">${rows}</div>
    <button class="fab" id="fab-add">+</button>
    ${sidebarHtml()}
    ${modalHtml()}
  `;

  document.getElementById('search-input').oninput = e=>{ state.search = e.target.value; renderListView(); };
  document.getElementById('sort-select').onchange = e=>{ state.sortBy = e.target.value; renderListView(); };
  document.getElementById('fab-add').onclick = ()=> openEditor(null);
  document.getElementById('btn-manage-cats').onclick = ()=>{ state.modal = {type:'categories'}; renderListView(); };
  document.getElementById('btn-open-sidebar').onclick = ()=>{ state.sidebarOpen = true; renderListView(); };
  document.querySelectorAll('.chip[data-cat]').forEach(el=>{
    el.onclick = ()=>{ state.filterCat = el.dataset.cat; state.filterMassPart = null; renderListView(); };
  });
  const backChip = document.querySelector('[data-back-to-folders]');
  if(backChip) backChip.onclick = ()=>{ state.filterMassPart = null; state.filterCat = 'All'; renderListView(); };

  document.querySelectorAll('.song-row').forEach(el=>{
    wireSongRowInteractions(el, el.dataset.id);
  });
  wireSidebar();
  wireModal();
}

// (2026-07-13) wire inline favorite toggling on song rows; prev: row click
function wireSongRowInteractions(el, id){
  let pressTimer = null, moved = false, longFired = false;
  
  const favEl = el.querySelector('.fav');
  if(favEl){
    const handleFavToggle = async (e)=>{
      e.stopPropagation();
      e.preventDefault();
      const song = state.songs.find(s=>s.id===id);
      if(song){
        song.favorite = !song.favorite;
        await Store.saveSong(song);
        renderListView();
      }
    };
    favEl.addEventListener('click', handleFavToggle);
    favEl.addEventListener('touchstart', (e)=>e.stopPropagation(), {passive:true});
    favEl.addEventListener('touchend', (e)=>e.stopPropagation(), {passive:true});
    favEl.addEventListener('mousedown', (e)=>e.stopPropagation());
    favEl.addEventListener('mouseup', (e)=>e.stopPropagation());
  }

  const start = (e)=>{
    if(e.target.closest('.fav')) return;
    moved = false; longFired = false;
    pressTimer = setTimeout(()=>{
      longFired = true;
      if(navigator.vibrate) navigator.vibrate(15);
      state.modal = {type:'song-context', id};
      renderListView();
    }, 480);
  };
  const cancel = ()=> clearTimeout(pressTimer);
  el.addEventListener('touchstart', start, {passive:true});
  el.addEventListener('touchmove', ()=>{ moved = true; cancel(); }, {passive:true});
  el.addEventListener('touchend', (e)=>{
    if(e.target.closest('.fav')) return;
    cancel();
    if(!moved && !longFired) openViewer(id);
  });
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', (e)=>{
    if(e.target.closest('.fav')) return;
    cancel();
    if(!longFired) openViewer(id);
  });
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('contextmenu', e=>e.preventDefault());
}

function openViewer(id, fromSetlistId){
  state.currentId = id;
  state.cameFromSetlistId = fromSetlistId || null;
  state.view = 'viewer';
  stopAutoscroll();
  stopMetronome();
  render();
}
function currentSong(){ return state.songs.find(s=>s.id===state.currentId); }

function renderViewer(){
  const song = currentSong();
  if(!song){ state.view='list'; return renderListView(); }
  const offset = song.transposeOffset||0;
  const preferFlat = FLAT_KEYS.has(transposeKeyLabel(song.key, offset));
  const body = offset ? transposeBody(song.body, offset, preferFlat) : song.body;
  const fontSize = song.viewerFontSize || 15;
  const scrollSpeed = song.viewerScrollSpeed || 30;

  const lines = body.split('\n').map(line=>{
    const cls = classifyLine(line);
    if(cls==='chord') return `<div class="lyric-line">${renderChordLine(line)}</div>`;
    if(cls==='bracket') return `<div class="lyric-line">${renderBracketLine(line)}</div>`;
    if(cls==='divider') return `<hr class="chart-hr"/>`;
    if(cls==='section') return `<div class="section-line">${escapeHtml(line)}</div>`;
    if(cls==='priest') return `<div class="priest-line">${escapeHtml(line)}</div>`;
    if(cls==='response') return `<div class="response-line">${escapeHtml(line)}</div>`;
    if(cls==='blank') return `<div>&nbsp;</div>`;
    return `<div class="lyric-line">${escapeHtml(line)}</div>`;
  }).join('');

  const beatsPerBar = parseInt((song.timeSig||'4/4').split('/')[0]) || 4;
  let beatDots = '';
  for(let i=0;i<beatsPerBar;i++) beatDots += `<span class="beat-dot" data-beat="${i}"></span>`;

// (2026-07-13) fix viewer flex layout and remove string node; prev: string in innerHTML
  app.innerHTML = `
    <div class="topbar" id="viewer-topbar">
      <button class="icon-btn" id="btn-back">${iconBack()}</button>
      <h1 style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:700;">${escapeHtml(song.title)}</h1>
      <button class="icon-btn" id="btn-speed-toggle" title="Speed Controls">${iconSpeedArrows()}</button>
      <button class="icon-btn playbar-play" id="btn-playpause" title="Play/Pause">${state.autoscroll ? iconPause() : iconPlay()}</button>
      <button class="icon-btn playbar-restart" id="btn-restart" title="Restart">${iconRestart()}</button>
      <button class="icon-btn" id="btn-adjust" title="Menu">${iconDots()}</button>
    </div>
    <div class="viewer-body">
      <div class="chart-wrap" id="chart-wrap" style="font-size:${fontSize}px">
        <div class="chart-title">${escapeHtml(song.title)}</div>
        <div class="chart-artist">${escapeHtml(song.artist||'')}</div>
        <div class="chart-meta-inline">
          <span>Key <b>${escapeHtml(transposeKeyLabel(song.key, offset)||'—')}</b></span>
          <span>Capo <b>${song.capo||0}</b></span>
          <span>Tempo <b>${song.tempo||'—'}</b> BPM</span>
          <span>Time <b>${escapeHtml(song.timeSig||'4/4')}</b></span>
          <span>Style <b>${escapeHtml(song.style||'—')}</b></span>
          <span>Instr. <b>${escapeHtml(song.instrument||'—')}</b></span>
          ${song.referenceUrl ? `<span><a href="${escapeHtml(song.referenceUrl)}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;font-weight:700;">&#9654; Reference</a></span>` : ''}
        </div>
        <div class="chart-body" id="chart-body">${lines}</div>
      </div>
      <div class="scroll-overlay" id="scroll-overlay">
        <button class="scroll-square up" id="tri-up">${iconBigTriangleUp()}<span class="scroll-square-label">Faster</span></button>
        <button class="scroll-square down" id="tri-down">${iconBigTriangleDown()}<span class="scroll-square-label">Slower</span></button>
      </div>
      <div class="speed-slider-wrap" id="speed-slider-wrap">
        <span class="speed-slider-icon">${iconSpeedArrows()}</span>
        <input type="range" id="speed-range-slider" min="5" max="100" value="${scrollSpeed}">
      </div>
    </div>
    ${modalHtml()}
  `;

  const chartWrap = document.getElementById('chart-wrap');
  const chartBody = document.getElementById('chart-body');

  document.getElementById('btn-back').onclick = ()=>{
    stopAutoscroll(); stopMetronome();
    if(state.cameFromSetlistId){
      state.currentSetlistId = state.cameFromSetlistId;
      state.cameFromSetlistId = null;
      state.view = 'setlist-editor';
    } else {
      state.view = 'list';
    }
    render();
  };
  document.getElementById('btn-adjust').onclick = ()=>{ state.modal = {type:'adjust', id:song.id}; renderViewer(); };
// (2026-07-13) 5s delay at top on restart; prev: chartWrap.scrollTo top
  document.getElementById('btn-restart').onclick = ()=>{
    chartWrap.scrollTo({top:0, behavior:'smooth'});
    autoscrollTopDelayUntil = performance.now() + 5000;
    autoscrollFloatPos = 0;
  };
  const playBtn = document.getElementById('btn-playpause');
  if(playBtn){
    playBtn.onclick = ()=>{
      if(state.autoscroll){
        stopAutoscroll();
        playBtn.innerHTML = iconPlay();
      } else {
        startAutoscroll(song);
        playBtn.innerHTML = iconPause();
      }
    };
  }
  
  const speedToggleBtn = document.getElementById('btn-speed-toggle');
  if(speedToggleBtn){
    speedToggleBtn.onclick = ()=>{
      const sliderWrap = document.getElementById('speed-slider-wrap');
      const overlay = document.getElementById('scroll-overlay');
      if(sliderWrap) sliderWrap.classList.toggle('hidden');
      if(overlay) overlay.style.display = overlay.style.display==='none' ? 'block' : 'none';
    };
  }

  const speedSlider = document.getElementById('speed-range-slider');
  if(speedSlider){
    speedSlider.oninput = async (e)=>{
      const newSpeed = parseInt(e.target.value)||30;
      song.viewerScrollSpeed = newSpeed;
      await Store.saveSong(song);
      const idx = state.songs.findIndex(s=>s.id===song.id);
      if(idx>=0) state.songs[idx] = song;
    };
  }

  document.querySelectorAll('.chord-tok').forEach(el=>{
    el.onclick = ()=>{ state.modal = {type:'chord', chord: el.dataset.chord}; renderViewer(); };
  });
  wireModal();

  /* Big transparent square buttons on the right: hold/tap continuous speed adjustment */
  wireSpeedSquare(document.getElementById('tri-up'), song, +1);
  wireSpeedSquare(document.getElementById('tri-down'), song, -1);

  /* Pinch-to-zoom directly on chart-wrap: reflows text incrementally and saves per-song. */
  wirePinchZoom(chartWrap, chartBody, song);

  // (2026-07-13) touch/wheel manual scroll tracking; prev: >4px scroll pause
  const markUserScroll = ()=>{ lastUserScrollAt = performance.now(); };
  chartWrap.addEventListener('touchstart', markUserScroll, {passive:true});
  chartWrap.addEventListener('touchmove', markUserScroll, {passive:true});
  chartWrap.addEventListener('wheel', markUserScroll, {passive:true});
  chartWrap.addEventListener('scroll', ()=>{
    if(!state.autoscroll) return;
    if(Math.abs(chartWrap.scrollTop - Math.floor(autoscrollFloatPos)) > 15){
      lastUserScrollAt = performance.now();
    }
  }, {passive:true});

  // Autoscroll defaults to ON when opening a song and never pauses during manual interaction unless pause button pressed.
  startAutoscroll(song);
}

/* ---------------- AUTOSCROLL (smooth, rAF-based) ---------------- */
// (2026-07-13) 5s top delay & user touch scroll pause; prev: >4px scroll pause
let autoscrollRAF = null, autoscrollLastTs = null, autoscrollFloatPos = 0, lastUserScrollAt = 0, autoscrollTopDelayUntil = 0;
// (2026-07-13) slower speed scale for smooth scroll; prev: 6+(speed/100)*94
function pxPerSecondFromSpeed(speed){
  return 2 + (speed/100)*48;
}
// (2026-07-13) 5s delay at top on startAutoscroll; prev: no top delay
function startAutoscroll(song){
  state.autoscroll = true;
  cancelAnimationFrame(autoscrollRAF);
  autoscrollLastTs = null;
  const el = document.getElementById('chart-wrap');
  if(el){
    autoscrollFloatPos = el.scrollTop;
    if(el.scrollTop <= 5) autoscrollTopDelayUntil = performance.now() + 5000;
  }
  const step = (ts)=>{
    if(!state.autoscroll) return;
    const chart = document.getElementById('chart-wrap');
    if(chart){
      // If the user (or anything else) has moved the real scroll position
      // meaningfully since our last frame, resync to it so we don't fight them.
      if(Math.abs(chart.scrollTop - autoscrollFloatPos) > 30){
        autoscrollFloatPos = chart.scrollTop;
      }
      if(autoscrollLastTs != null){
        const dt = Math.min((ts - autoscrollLastTs) / 1000, 0.05);
        const speed = (currentSong() || song).viewerScrollSpeed || 30;
        if(performance.now() - lastUserScrollAt < 850){
          autoscrollFloatPos = chart.scrollTop;
          if(chart.scrollTop <= 5) autoscrollTopDelayUntil = performance.now() + 5000;
        } else if(performance.now() < autoscrollTopDelayUntil){
          autoscrollFloatPos = chart.scrollTop;
        } else {
          autoscrollFloatPos += pxPerSecondFromSpeed(speed) * dt;
          chart.scrollTop = Math.round(autoscrollFloatPos);
        }
      }
      autoscrollLastTs = ts;
    }
    autoscrollRAF = requestAnimationFrame(step);
  };
  autoscrollRAF = requestAnimationFrame(step);
}
function stopAutoscroll(){
  state.autoscroll = false;
  cancelAnimationFrame(autoscrollRAF);
}

function wireSpeedSquare(el, song, direction){
  if(!el) return;
  let intervalId = null;
  const clamp = v => Math.max(5, Math.min(100, v));
  const updateSpeed = async (delta)=>{
    song.viewerScrollSpeed = clamp((song.viewerScrollSpeed||30) + delta);
    await Store.saveSong(song);
    const slider = document.getElementById('speed-range-slider');
    if(slider) slider.value = song.viewerScrollSpeed;
    const idx = state.songs.findIndex(s=>s.id===song.id);
    if(idx>=0) state.songs[idx] = song;
  };
  const startHold = (e)=>{
    if(e.cancelable) e.preventDefault();
    el.classList.add('is-pressed');
    updateSpeed(direction * 3);
    clearInterval(intervalId);
    intervalId = setInterval(()=>{
      updateSpeed(direction * 2);
    }, 120);
  };
  const endHold = ()=>{
    el.classList.remove('is-pressed');
    clearInterval(intervalId);
  };
  el.addEventListener('touchstart', startHold, {passive:false});
  el.addEventListener('touchend', endHold, {passive:true});
  el.addEventListener('touchcancel', endHold, {passive:true});
  el.addEventListener('mousedown', startHold);
  el.addEventListener('mouseup', endHold);
  el.addEventListener('mouseleave', endHold);
}

// (2026-07-13) scale chart-wrap font-size for all texts; prev: body only
function wirePinchZoom(chartWrap, chartBody, song){
  const target = chartWrap || document.getElementById('chart-wrap') || document.querySelector('.viewer-body');
  if(!target) return;
  let startDist = null, startSize = null;

  const getDist = (t)=>{
    if(!t || t.length < 2) return null;
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  };

  const getCurSize = ()=> parseFloat(chartWrap.style.fontSize) || parseFloat(chartBody ? chartBody.style.fontSize : '') || song.viewerFontSize || 15;

  const saveFinalSize = async ()=>{
    const finalSize = Math.round(getCurSize());
    song.viewerFontSize = finalSize;
    await Store.saveSong(song);
    const idx = state.songs.findIndex(s=>s.id===song.id);
    if(idx>=0) state.songs[idx] = song;
  };

  target.addEventListener('touchstart', e=>{
    if(e.touches && e.touches.length === 2){
      if(e.cancelable) e.preventDefault();
      startDist = getDist(e.touches);
      startSize = getCurSize();
    } else {
      startDist = null;
      startSize = null;
    }
  }, {passive:false});

  target.addEventListener('touchmove', e=>{
    if(e.touches && e.touches.length === 2){
      if(e.cancelable) e.preventDefault();
      const curDist = getDist(e.touches);
      if(!startDist || !startSize){
        startDist = curDist;
        startSize = getCurSize();
      } else if(curDist && startDist > 0){
        const scale = curDist / startDist;
        const newSize = Math.max(10, Math.min(60, startSize * scale));
        chartWrap.style.fontSize = newSize.toFixed(2) + 'px';
      }
    } else {
      if(startDist){
        saveFinalSize();
        startDist = null;
        startSize = null;
      }
    }
  }, {passive:false});

  target.addEventListener('touchend', async (e)=>{
    if(startDist && (!e.touches || e.touches.length < 2)){
      await saveFinalSize();
      startDist = null;
      startSize = null;
    }
  }, {passive:true});

  target.addEventListener('touchcancel', async ()=>{
    if(startDist){
      await saveFinalSize();
      startDist = null;
      startSize = null;
    }
  }, {passive:true});

  let gestureStartSize = null;
  target.addEventListener('gesturestart', e=>{
    if(e.cancelable) e.preventDefault();
    gestureStartSize = getCurSize();
  }, {passive:false});

  target.addEventListener('gesturechange', e=>{
    if(e.cancelable) e.preventDefault();
    if(gestureStartSize){
      const newSize = Math.max(10, Math.min(60, gestureStartSize * e.scale));
      chartWrap.style.fontSize = newSize.toFixed(2) + 'px';
    }
  }, {passive:false});

  target.addEventListener('gestureend', async e=>{
    if(e.cancelable) e.preventDefault();
    if(gestureStartSize){
      await saveFinalSize();
      gestureStartSize = null;
    }
  }, {passive:false});
}

function startMetronome(bpm, beatsPerBar){
  state.metronomeOn = true;
  metroBeat = 0;
  if(!metroCtx) metroCtx = new (window.AudioContext||window.webkitAudioContext)();
  if(metroCtx.state === 'suspended') metroCtx.resume();
  const interval = 60000/(bpm||90);
  clearInterval(metroTimer);
  const tick = ()=>{
    const t = metroCtx.currentTime;
    const osc = metroCtx.createOscillator();
    const gain = metroCtx.createGain();
    osc.frequency.value = metroBeat===0 ? 1200 : 800;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    osc.connect(gain); gain.connect(metroCtx.destination);
    osc.start(t); osc.stop(t+0.09);
    document.querySelectorAll('.beat-dot').forEach((d,i)=>{
      d.classList.toggle('hit', i===metroBeat);
      d.classList.toggle('accent-hit', i===metroBeat && metroBeat===0);
    });
    metroBeat = (metroBeat+1)%beatsPerBar;
  };
  tick();
  metroTimer = setInterval(tick, interval);
}
function stopMetronome(){ state.metronomeOn=false; clearInterval(metroTimer); }

/* ============================================================
   SLIDE-IN OVERLAY (used for the editor, opened via the FAB)
   ============================================================
   Rather than replacing the whole app view, the editor mounts as a
   full-screen panel that slides in from the right over whatever was
   showing before (list or viewer), and slides back out on close —
   the underlying view is left untouched in the DOM the whole time,
   so closing it is instant with no re-render flicker. */
function mountEditorOverlay(){
  let overlay = document.getElementById('editor-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'editor-overlay';
    overlay.className = 'view-overlay';
    app.appendChild(overlay);
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ overlay.classList.add('in'); }); });
  }
  return overlay;
}
function closeEditorOverlay(afterClose){
  const overlay = document.getElementById('editor-overlay');
  if(!overlay){ if(afterClose) afterClose(); return; }
  overlay.style.pointerEvents = 'none';
  overlay.classList.remove('in');
  setTimeout(()=>{
    overlay.remove();
    if(afterClose) afterClose();
  }, 340);
}

function openEditor(id){
  const song = id ? state.songs.find(s=>s.id===id) : null;
  state.editingDraft = song ? {...song} : {
    id: uid(), title:'', artist:'', key:'C', capo:0, tempo:90, timeSig:'4/4', style:'', instrument:'',
    categories: [], favorite:false, transposeOffset:0, dateAdded: Date.now(), body:''
  };
  if(!state.editingDraft.categories){
    state.editingDraft.categories = state.editingDraft.category ? [state.editingDraft.category] : [];
  }
  state.view = 'editor';
  mountEditorOverlay();
  renderEditor();
}
function insertAtCursor(textarea, text){
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  textarea.value = textarea.value.slice(0,start) + text + textarea.value.slice(end);
  const newPos = start + text.length;
  textarea.selectionStart = textarea.selectionEnd = newPos;
  textarea.focus();
}

function renderEditor(){
  const d = state.editingDraft;
  const timeSigs = ['4/4','3/4','6/8','2/4','12/8','5/4'];
  const timeOptions = timeSigs.map(t=>`<option value="${t}" ${d.timeSig===t?'selected':''}>${t}</option>`).join('') + `<option value="custom" ${!timeSigs.includes(d.timeSig)?'selected':''}>Custom…</option>`;
  const isExisting = !!state.songs.find(s=>s.id===d.id);
  const sectionNames = ['Verse','Chorus','Bridge','Intro','Outro','Pre-Chorus'];
  const container = document.getElementById('editor-overlay') || app;

  container.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="btn-cancel">${iconBack()}</button>
      <h1>${isExisting ? 'Edit song' : 'New song'}</h1>
      ${isExisting ? `<button class="icon-btn" id="btn-delete" style="color:var(--danger)">${iconTrash()}</button>` : ''}
    </div>
    <div class="editor">
      <div class="field" id="field-title"><label>Title <span class="req">*</span></label><input id="f-title" value="${escapeHtml(d.title)}" placeholder="Song title"/></div>
      <div class="field"><label>Artist</label><input id="f-artist" value="${escapeHtml(d.artist)}" placeholder="Artist / writer"/></div>
      <div class="field-row">
        <div class="field"><label>Key</label><input id="f-key" value="${escapeHtml(d.key)}" placeholder="e.g. G, Bbm"/></div>
        <div class="field"><label>Capo</label><input id="f-capo" type="number" value="${d.capo}" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Tempo (BPM)</label><input id="f-tempo" type="number" value="${d.tempo}"/></div>
        <div class="field">
          <label>Time signature</label>
          <select id="f-timesig">${timeOptions}</select>
        </div>
      </div>
      <div class="field" id="custom-timesig-wrap" style="display:${timeSigs.includes(d.timeSig)?'none':'block'}">
        <label>Custom time signature</label><input id="f-timesig-custom" value="${escapeHtml(timeSigs.includes(d.timeSig)?'':d.timeSig)}" placeholder="e.g. 7/8"/>
      </div>
      <div class="field-row">
        <div class="field"><label>Style / genre</label><input id="f-style" value="${escapeHtml(d.style)}" placeholder="e.g. Ballad, Rock, Hymn"/></div>
        <div class="field"><label>Instrument / voice</label><input id="f-instrument" value="${escapeHtml(d.instrument)}" placeholder="e.g. Guitar, Piano, Vocal"/></div>
      </div>
      <div class="field" id="field-massparts">
        <label>Mass Part <span class="req">*</span></label>
        <div class="cat-toggle-wrap" id="mp-toggle-wrap">
          ${state.massParts.map(c=>`<div class="cat-toggle mp-toggle ${((d.massParts||[]).includes(c))?'selected':''}" data-mp="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>Folders / seasons</label>
        <div class="cat-toggle-wrap" id="cat-toggle-wrap">
          ${state.categories.map(c=>`<div class="cat-toggle ${((d.categories||[]).includes(c))?'selected':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>Chord chart</label>
        <div class="quick-insert-row">
          <button type="button" class="quick-chip divider-chip" id="ins-divider">+ Divider</button>
          ${sectionNames.map(s=>`<button type="button" class="quick-chip section-chip" data-ins-section="${s}">${s}</button>`).join('')}
          <button type="button" class="quick-chip priest-chip" data-ins-section="Priest">Priest</button>
          <button type="button" class="quick-chip response-chip" data-ins-section="Response">Response</button>
        </div>
        <textarea id="f-body" placeholder="Put the chord line directly above its lyric line, e.g.&#10;G          C      G&#10;Amazing grace, how sweet the sound">${escapeHtml(d.body)}</textarea>
        <div class="hint">Type <b>--</b> or <b>==</b> then space/enter for a divider. Wrap chords like <b>&gt; G D Em</b> for yellow inline chords.</div>
      </div>
    </div>
    <div class="save-bar">
      <button class="btn btn-secondary" id="btn-cancel2">Cancel</button>
      <button class="btn btn-primary" id="btn-save">Save</button>
    </div>
    ${modalHtml()}
  `;

  const back = ()=>{
    closeEditorOverlay(()=>{
      state.view = state.currentId ? 'viewer' : 'list';
      render();
    });
  };
  document.getElementById('btn-cancel').onclick = back;
  document.getElementById('btn-cancel2').onclick = back;
  document.getElementById('f-timesig').onchange = e=>{
    document.getElementById('custom-timesig-wrap').style.display = e.target.value==='custom' ? 'block':'none';
  };
  document.querySelectorAll('.cat-toggle[data-cat]').forEach(el=>{
    el.onclick = ()=>{
      const c = el.dataset.cat;
      d.categories = d.categories || [];
      const idx = d.categories.indexOf(c);
      if(idx>=0) d.categories.splice(idx,1); else d.categories.push(c);
      el.classList.toggle('selected');
    };
  });
  document.querySelectorAll('.mp-toggle').forEach(el=>{
    el.onclick = ()=>{
      const c = el.dataset.mp;
      d.massParts = d.massParts || [];
      const idx = d.massParts.indexOf(c);
      if(idx>=0) d.massParts.splice(idx,1); else d.massParts.push(c);
      el.classList.toggle('selected');
      if(d.massParts.length>0) document.getElementById('mp-toggle-wrap').classList.remove('invalid');
    };
  });
  document.getElementById('f-title').addEventListener('input', (e)=>{
    if(e.target.value.trim()) document.getElementById('field-title').classList.remove('invalid');
  });
  const bodyEl = document.getElementById('f-body');
  document.getElementById('ins-divider').onclick = ()=> insertAtCursor(bodyEl, '\n' + '='.repeat(40) + '\n');
  document.querySelectorAll('[data-ins-section]').forEach(el=>{
    el.onclick = ()=> insertAtCursor(bodyEl, '\n' + el.dataset.insSection + '\n');
  });
  // Auto-expand --, ==, === typed then space/enter into a full-width divider line
  bodyEl.addEventListener('keydown', (e)=>{
    if(e.key===' ' || e.key==='Enter'){
      const pos = bodyEl.selectionStart;
      const before = bodyEl.value.slice(0,pos);
      const m = /(^|\n)(--|==|===)$/.exec(before);
      if(m){
        e.preventDefault();
        const start = pos - m[2].length;
        const divider = '='.repeat(40);
        bodyEl.value = bodyEl.value.slice(0,start) + divider + bodyEl.value.slice(pos);
        bodyEl.selectionStart = bodyEl.selectionEnd = start + divider.length;
      }
    }
  });
  const delBtn = document.getElementById('btn-delete');
  if(delBtn) delBtn.onclick = async ()=>{
    if(confirm('Delete this song? This cannot be undone.')){
      await Store.deleteSong(d.id);
      state.songs = state.songs.filter(s=>s.id!==d.id);
      state.currentId = null;
      closeEditorOverlay(()=>{ state.view='list'; render(); });
    }
  };
  document.getElementById('btn-save').onclick = async ()=>{
    let hasError = false;
    const titleVal = document.getElementById('f-title').value.trim();
    const titleField = document.getElementById('field-title');
    if(!titleVal){
      titleField.classList.add('invalid');
      titleField.classList.remove('shake'); void titleField.offsetWidth; titleField.classList.add('shake');
      hasError = true;
    } else {
      titleField.classList.remove('invalid');
    }
    const mpWrap = document.getElementById('mp-toggle-wrap');
    if(!d.massParts || d.massParts.length===0){
      mpWrap.classList.add('invalid');
      const mpField = document.getElementById('field-massparts');
      mpField.classList.remove('shake'); void mpField.offsetWidth; mpField.classList.add('shake');
      hasError = true;
    } else {
      mpWrap.classList.remove('invalid');
    }
    if(hasError){
      const targetEl = titleVal ? document.getElementById('field-massparts') : titleField;
      if(targetEl && targetEl.scrollIntoView) targetEl.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }

    const timeSel = document.getElementById('f-timesig').value;
    const timeVal = timeSel==='custom' ? (document.getElementById('f-timesig-custom').value.trim()||'4/4') : timeSel;
    const song = {
      ...d,
      title: titleVal,
      artist: document.getElementById('f-artist').value.trim(),
      key: document.getElementById('f-key').value.trim(),
      capo: +document.getElementById('f-capo').value || 0,
      tempo: +document.getElementById('f-tempo').value || 90,
      timeSig: timeVal,
      style: document.getElementById('f-style').value.trim(),
      instrument: document.getElementById('f-instrument').value.trim(),
      categories: d.categories || [],
      massParts: d.massParts || [],
      body: document.getElementById('f-body').value,
    };
    try{
      await Store.saveSong(song);
      const idx = state.songs.findIndex(s=>s.id===song.id);
      if(idx>=0) state.songs[idx] = song; else state.songs.push(song);
      state.currentId = song.id;
      closeEditorOverlay(()=>{
        state.view = 'viewer';
        render();
        showToast('Saved');
      });
    }catch(e){
      alert('Could not save — please try again.');
    }
  };
}

/* ============================================================
   SETLISTS / MASS PLANS
   ============================================================
   A setlist is an ordered sequence of items — song references and
   custom section labels (e.g. "Entrance Songs", "Kyrie", "Gloria") —
   built for a specific Mass. A setlist can be a reusable Template
   (no date) or a dated instance tied to an actual Mass; templates can
   be duplicated into a new dated plan without disturbing the original.
   Reordering uses up/down controls rather than drag-and-drop, since
   that's reliable across every phone without extra libraries. */

function newSetlistItemId(){ return 'i' + uid(); }

function renderSetlistsView(){
  const templates = state.setlists.filter(s=>s.isTemplate);
  const dated = state.setlists.filter(s=>!s.isTemplate).sort((a,b)=>(a.date||'').localeCompare(b.date||''));

  const row = (sl)=>`
    <div class="song-row" data-setlist-id="${sl.id}">
      <span class="fav" style="display:flex;align-items:center;">${iconSetlist()}</span>
      <div style="flex:1;min-width:0;">
        <div class="song-title">${escapeHtml(sl.name)}</div>
        <div class="song-sub">${sl.isTemplate ? 'Template' : escapeHtml(sl.date||'No date')} &middot; ${sl.items.length} item${sl.items.length===1?'':'s'}</div>
      </div>
    </div>`;

  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="btn-back">${iconBack()}</button>
      <h1>Setlists / Mass Plans</h1>
    </div>
    <div class="list-wrap">
      <div class="letter-divider">DATED MASSES</div>
      ${dated.length ? dated.map(row).join('') : `<div class="empty-state">No dated Mass plans yet.</div>`}
      <div class="letter-divider">TEMPLATES</div>
      ${templates.length ? templates.map(row).join('') : `<div class="empty-state">No templates yet.</div>`}
    </div>
    <button class="fab" id="fab-add-setlist">+</button>
    ${modalHtml()}
  `;

  document.getElementById('btn-back').onclick = ()=>{ state.view='list'; render(); };
  document.getElementById('fab-add-setlist').onclick = ()=>{ state.modal = {type:'new-setlist'}; renderSetlistsView(); };
  document.querySelectorAll('[data-setlist-id]').forEach(el=>{
    el.onclick = ()=>{ state.currentSetlistId = el.dataset.setlistId; state.view='setlist-editor'; render(); };
  });
  wireModal();
}

function currentSetlist(){ return state.setlists.find(s=>s.id===state.currentSetlistId); }

function renderSetlistEditor(){
  const sl = currentSetlist();
  if(!sl){ state.view='setlists'; return renderSetlistsView(); }

  const itemRows = sl.items.map((item, idx)=>{
    const isFirst = idx===0, isLast = idx===sl.items.length-1;
    const upDown = `
      <div class="reorder-col">
        <button class="icon-btn reorder-btn" data-move-up="${idx}" ${isFirst?'disabled':''}>${iconArrowUp()}</button>
        <button class="icon-btn reorder-btn" data-move-down="${idx}" ${isLast?'disabled':''}>${iconArrowDown()}</button>
      </div>`;
    if(item.type==='section'){
      return `
        <div class="song-row" data-section-idx="${idx}" style="cursor:default;">
          ${upDown}
          <div style="flex:1;min-width:0;" class="section-line" style="font-weight:800;">${escapeHtml(item.label)}</div>
          <button class="icon-btn" data-rename-section="${idx}">${iconEdit()}</button>
          <button class="icon-btn" data-remove-item="${idx}" style="color:var(--danger);">${iconCross()}</button>
        </div>`;
    }
    const song = state.songs.find(s=>s.id===item.songId);
    const title = song ? song.title : '(song removed)';
    const sub = song ? `${escapeHtml(song.artist||'Unknown')} &middot; Key ${escapeHtml(transposeKeyLabel(song.key, song.transposeOffset||0)||'—')}` : '';
    return `
      <div class="song-row" data-song-item-idx="${idx}">
        ${upDown}
        <div style="flex:1;min-width:0;">
          <div class="song-title">${escapeHtml(title)}</div>
          <div class="song-sub">${sub}</div>
        </div>
        <button class="icon-btn" data-remove-item="${idx}" style="color:var(--danger);">${iconCross()}</button>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="btn-back">${iconBack()}</button>
      <h1>${escapeHtml(sl.name)}</h1>
      <button class="icon-btn" id="btn-rename-setlist">${iconEdit()}</button>
      <button class="icon-btn" id="btn-delete-setlist" style="color:var(--danger);">${iconTrash()}</button>
    </div>
    <div class="chart-meta-inline" style="padding:10px 16px 0;">
      <span>${sl.isTemplate ? '<b>Template</b>' : `Date <b>${escapeHtml(sl.date||'—')}</b>`}</span>
    </div>
    <div class="list-wrap">
      ${sl.items.length ? itemRows : `<div class="empty-state">Empty so far.<br>Add a section header (like "Entrance", "Kyrie") or a song below.</div>`}
    </div>
    <div class="save-bar">
      <button class="btn btn-secondary" id="btn-add-section">+ Section</button>
      <button class="btn btn-primary" id="btn-add-song">+ Song</button>
      ${sl.isTemplate ? '<button class="btn btn-secondary" id="btn-duplicate-dated">Use for a date&hellip;</button>' : ''}
    </div>
    ${modalHtml()}
  `;

  document.getElementById('btn-back').onclick = ()=>{ state.view='setlists'; state.currentSetlistId=null; render(); };
  document.getElementById('btn-rename-setlist').onclick = ()=>{ state.modal = {type:'rename-setlist', id: sl.id}; renderSetlistEditor(); };
  document.getElementById('btn-delete-setlist').onclick = async ()=>{
    if(confirm(`Delete "${sl.name}"? This cannot be undone.`)){
      await Store.deleteSetlist(sl.id);
      state.setlists = state.setlists.filter(s=>s.id!==sl.id);
      state.currentSetlistId = null;
      state.view = 'setlists';
      render();
    }
  };
  document.getElementById('btn-add-section').onclick = ()=>{ state.modal = {type:'add-section', setlistId: sl.id}; renderSetlistEditor(); };
  document.getElementById('btn-add-song').onclick = ()=>{ state.modal = {type:'add-song-to-setlist', setlistId: sl.id, search:''}; renderSetlistEditor(); };
  const dupBtn = document.getElementById('btn-duplicate-dated');
  if(dupBtn) dupBtn.onclick = ()=>{ state.modal = {type:'duplicate-setlist', id: sl.id}; renderSetlistEditor(); };

  const persist = async ()=>{ await Store.saveSetlist(sl); renderSetlistEditor(); };
  document.querySelectorAll('[data-move-up]').forEach(el=>{
    el.onclick = ()=>{
      const i = +el.dataset.moveUp;
      if(i>0){ [sl.items[i-1], sl.items[i]] = [sl.items[i], sl.items[i-1]]; persist(); }
    };
  });
  document.querySelectorAll('[data-move-down]').forEach(el=>{
    el.onclick = ()=>{
      const i = +el.dataset.moveDown;
      if(i<sl.items.length-1){ [sl.items[i+1], sl.items[i]] = [sl.items[i], sl.items[i+1]]; persist(); }
    };
  });
  document.querySelectorAll('[data-remove-item]').forEach(el=>{
    el.onclick = ()=>{ sl.items.splice(+el.dataset.removeItem, 1); persist(); };
  });
  document.querySelectorAll('[data-rename-section]').forEach(el=>{
    el.onclick = ()=>{
      const idx = +el.dataset.renameSection;
      state.modal = {type:'rename-section', setlistId: sl.id, itemIdx: idx};
      renderSetlistEditor();
    };
  });
  document.querySelectorAll('[data-song-item-idx]').forEach(el=>{
    el.onclick = (e)=>{
      if(e.target.closest('[data-move-up],[data-move-down],[data-remove-item]')) return;
      const idx = +el.dataset.songItemIdx;
      const item = sl.items[idx];
      if(item && item.songId && state.songs.find(s=>s.id===item.songId)){
        openViewer(item.songId, sl.id);
      }
    };
  });
  wireModal();
}


function sidebarHtml(){
  const folderItems = state.categories.map(c=>{
    const count = state.songs.filter(s=>(s.categories||[]).includes(c)).length;
    return `<div class="side-item" data-goto-folder="${escapeHtml(c)}"><span>${escapeHtml(c)}</span><span class="side-count">${count}</span></div>`;
  }).join('');
  const massPartItems = state.massParts.map(mp=>{
    const count = state.songs.filter(s=>(s.massParts||[]).includes(mp)).length;
    return `<div class="side-item" data-goto-masspart="${escapeHtml(mp)}"><span>${escapeHtml(mp)}</span><span class="side-count">${count}</span></div>`;
  }).join('');
  return `
    <div class="sidebar-backdrop ${state.sidebarOpen?'active':''}" id="sidebar-backdrop">
      <div class="sidebar" id="sidebar">
        <div class="sidebar-head">
          <div style="font-weight:800;font-size:16px;">My Songbook</div>
          <button class="icon-btn" id="btn-close-sidebar">${iconClose()}</button>
        </div>
        <div class="side-item" data-goto-all="1" style="display:flex;align-items:center;gap:10px;"><span style="display:flex;align-items:center;">${iconMusic()}</span><span>All Songs</span></div>
        <div class="side-item" data-goto-fav="1" style="display:flex;align-items:center;gap:10px;"><span style="display:flex;align-items:center;">${iconStar(true)}</span><span>Favorites</span></div>
        <div class="side-item" data-goto-setlists="1" style="display:flex;align-items:center;gap:10px;"><span style="display:flex;align-items:center;">${iconSetlist()}</span><span>Setlists / Mass Plans</span><span class="side-count">${state.setlists.length}</span></div>
        <div class="side-section-label">FOLDERS / SEASONS</div>
        ${folderItems}
        <div class="side-item side-add" id="side-add-folder"><span>+ New folder</span></div>
        <div class="side-section-label">BROWSE BY MASS PART</div>
        ${massPartItems}
        <div class="side-item side-add" id="side-add-masspart"><span>+ New Mass Part</span></div>
        <div class="side-item side-add" id="side-import-gsma" style="display:flex;align-items:center;gap:10px;"><span style="display:flex;align-items:center;">${iconImport()}</span><span>Import .gsma / .gsm</span><input type="file" id="gsma-file-input" accept=".gsma,.gsm,.txt" style="display:none;"/></div>
        <div style="flex:1"></div>
        <div class="sidebar-foot">
          ${Store.mode==='firebase' ? `<div class="hint">Signed in &middot; syncing to your account</div><button class="btn btn-secondary" id="btn-signout" style="margin-top:8px;">Sign out</button>` :
            (FIREBASE_READY ? `<button class="btn btn-primary" id="btn-signin-from-sidebar" style="margin-top:4px;">Sign in with Google</button>` :
            `<div class="hint">Local/offline storage mode</div>`)}
        </div>
      </div>
    </div>`;
}
function wireSidebar(){
  const backdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('sidebar');
  if(!backdrop || !sidebar) return;

  const closeSidebar = (callback)=>{
    state.sidebarOpen = false;
    backdrop.classList.remove('active');
    if(callback){
      setTimeout(callback, 280);
    }
  };

  backdrop.onclick = (e)=>{ if(e.target===backdrop){ closeSidebar(); } };
  document.getElementById('btn-close-sidebar').onclick = ()=>{ closeSidebar(); };

  /* Touch swipe left gesture to close sidebar */
  let startX = 0, currentX = 0;
  sidebar.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
  sidebar.addEventListener('touchmove', (e)=>{
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if(diff < 0) sidebar.style.transform = `translateX(${diff}px)`;
  }, {passive:true});
  sidebar.addEventListener('touchend', ()=>{
    sidebar.style.transform = '';
    if(currentX > 0 && currentX < startX - 45){
      closeSidebar();
    }
  }, {passive:true});

  document.querySelector('[data-goto-all]').onclick = ()=>{ closeSidebar(()=>{ state.filterCat='All'; state.filterMassPart=null; renderListView(); }); };
  document.querySelector('[data-goto-fav]').onclick = ()=>{ closeSidebar(()=>{ state.filterCat='Favorites'; state.filterMassPart=null; renderListView(); }); };
  document.querySelector('[data-goto-setlists]').onclick = ()=>{ closeSidebar(()=>{ state.view='setlists'; render(); }); };
  document.querySelectorAll('[data-goto-folder]').forEach(el=>{
    el.onclick = ()=>{ closeSidebar(()=>{ state.filterCat = el.dataset.gotoFolder; state.filterMassPart=null; renderListView(); }); };
  });
  document.querySelectorAll('[data-goto-masspart]').forEach(el=>{
    el.onclick = ()=>{ closeSidebar(()=>{ state.filterMassPart = el.dataset.gotoMasspart; renderListView(); }); };
  });
  document.getElementById('side-add-folder').onclick = ()=>{ closeSidebar(()=>{ state.modal={type:'categories'}; renderListView(); }); };
  document.getElementById('side-add-masspart').onclick = ()=>{ closeSidebar(()=>{ state.modal={type:'massparts'}; renderListView(); }); };
  const importBtn = document.getElementById('side-import-gsma');
  const fileInput = document.getElementById('gsma-file-input');
  if(importBtn && fileInput){
    importBtn.onclick = ()=> fileInput.click();
    fileInput.onchange = async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      fileInput.value = ''; // allow re-selecting the same file later
      const reader = new FileReader();
      reader.onload = async (ev)=>{
        const text = ev.target.result;
        let parsed;
        try{ parsed = parseGSMA(text); }
        catch(err){ alert('Could not read that file — is it a .gsma/.gsm export?'); return; }
        const { folderName, songs: parsedSongs } = parsed;
        if(!parsedSongs || parsedSongs.length===0){
          alert('Could not find any songs in that file.');
          return;
        }
        const existingGuids = new Set(state.songs.map(s=>s.importedGuid).filter(Boolean));
        const toImport = parsedSongs.filter(s=>!s.importedGuid || !existingGuids.has(s.importedGuid));
        const skipped = parsedSongs.length - toImport.length;

        if(!state.categories.includes(folderName)){
          state.categories.push(folderName);
          await Store.saveCategories(state.categories);
        }

        closeSidebar(async ()=>{
          showToast(`Importing ${toImport.length} song(s)…`);
          for(const draft of toImport){
            const song = { id: uid(), dateAdded: Date.now(), ...draft };
            await Store.saveSong(song);
            state.songs.push(song);
          }
          const summary = skipped>0
            ? `Imported ${toImport.length} song(s) into "${folderName}" (${skipped} already imported, skipped)`
            : `Imported ${toImport.length} song(s) into "${folderName}"`;
          showToast(summary);
          renderListView();
        });
      };
      reader.onerror = ()=> alert('Could not read that file.');
      reader.readAsText(file);
    };
  }
  const signOutBtn = document.getElementById('btn-signout');
  if(signOutBtn) signOutBtn.onclick = async ()=>{
    await firebase.auth().signOut();
    closeSidebar();
  };
  const signInBtn = document.getElementById('btn-signin-from-sidebar');
  if(signInBtn) signInBtn.onclick = ()=>{ closeSidebar(()=>{ state.view='auth'; render(); }); };
}

function modalHtml(){
  if(!state.modal) return '';
  if(state.modal.type==='chord'){
    const c = parseChord(state.modal.chord);
    if(!c) return `<div class="modal-backdrop center" id="modal-bg"><div class="modal card"><button class="icon-btn modal-close" id="modal-x">${iconClose()}</button><div class="chord-name">${escapeHtml(state.modal.chord)}</div><div class="hint" style="text-align:center">No diagram available for this symbol.</div></div></div>`;
    const shape = getGuitarShape(c.root, c.acc, c.quality);
    const tones = chordTones(c.root, c.acc, c.quality);
    const rootIdx = noteIndex(c.root, c.acc);
    const tab = state.modal.tab || 'piano';
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card">
          <button class="icon-btn modal-close" id="modal-x">${iconClose()}</button>
          <div class="chord-name">${escapeHtml(state.modal.chord)}</div>
          <div class="diagram-tabs">
            <button class="${tab==='guitar'?'active':''}" data-tab="guitar">Guitar</button>
            <button class="${tab==='piano'?'active':''}" data-tab="piano">Piano</button>
          </div>
          ${tab==='guitar' ? buildFretboardSVG(shape.frets, shape.offset) : buildKeyboardSVG(tones, rootIdx)}
        </div>
      </div>`;
  }
  if(state.modal.type==='categories'){
    const items = state.categories.map(c=>`
      <div class="cat-item"><span>${escapeHtml(c)}</span><span class="small-x" data-del="${escapeHtml(c)}">${iconCross()}</span></div>
    `).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Folders</h3>
          <div class="cat-list">${items}</div>
          <div class="add-cat-row">
            <input id="new-cat-input" placeholder="New folder name, e.g. Lent Songs"/>
            <button class="btn btn-primary" style="flex:0 0 auto;padding:10px 16px" id="add-cat-btn">Add</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='massparts'){
    const items = state.massParts.map(c=>`
      <div class="cat-item"><span>${escapeHtml(c)}</span><span class="small-x" data-del-mp="${escapeHtml(c)}">${iconCross()}</span></div>
    `).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Mass Parts</h3>
          <div class="hint" style="margin-bottom:10px;">These describe a song's role in the liturgy (Entrance, Offertory, Communion, etc.) — separate from which folder/season it's filed under.</div>
          <div class="cat-list">${items}</div>
          <div class="add-cat-row">
            <input id="new-mp-input" placeholder="New Mass Part name"/>
            <button class="btn btn-primary" style="flex:0 0 auto;padding:10px 16px" id="add-mp-btn">Add</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='song-context'){
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return '';
    const folderToggles = state.categories.map(c=>`<div class="cat-toggle ${(song.categories||[]).includes(c)?'selected':''}" data-ctx-folder="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>${escapeHtml(song.title)}</h3>
          <div style="display:flex;gap:10px;margin-bottom:16px;">
            <button class="btn btn-secondary" id="ctx-edit">Edit song</button>
            <button class="btn btn-danger" id="ctx-delete">Delete</button>
          </div>
          <div class="field">
            <label>Add to folder(s)</label>
            <div class="cat-toggle-wrap">${folderToggles}</div>
            <div class="hint">Tap any folder to file this same song there too — it's still one song, edited in one place.</div>
          </div>
        </div>
      </div>`;
  }
// (2026-07-13) move metronome to adjust menu; prev: metronome on top playbar
  if(state.modal.type==='adjust'){
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return '';
    const offset = song.transposeOffset||0;
    const beatsPerBar = parseInt((song.timeSig||'4/4').split('/')[0]) || 4;
    let beatDots = '';
    for(let i=0;i<beatsPerBar;i++) beatDots += `<span class="beat-dot" data-beat="${i}"></span>`;
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card" style="max-width:300px;">
          <button class="icon-btn modal-close" id="modal-x">${iconClose()}</button>
          <h3 style="text-align:center;">Adjustments</h3>
          <div class="field">
            <label>Metronome (${song.tempo||90} BPM)</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <button class="toolbtn ${state.metronomeOn?'on':''}" id="btn-metro" title="Metronome" style="width:42px;height:42px;flex-shrink:0;">${iconMetro()}</button>
              <span class="metronome-badge" style="flex:1;justify-content:center;">${beatDots}</span>
            </div>
          </div>
          <div class="field">
            <label>Transpose</label>
            <div class="transpose-readout">
              <span class="transpose-delta">${offset===0 ? '\u00b10' : (offset>0?'+':'') + offset}</span>
              <span class="transpose-key">${escapeHtml(transposeKeyLabel(song.key, offset)||'—')}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="toolbtn" style="flex:1;" id="adj-down">&minus;</button>
              <button class="toolbtn" style="flex:1;" id="adj-reset">Reset</button>
              <button class="toolbtn" style="flex:1;" id="adj-up">+</button>
            </div>
          </div>
          <div class="field">
            <label>Text size (pinch on the chart to zoom too)</label>
            <div style="display:flex;gap:8px;">
              <button class="toolbtn" style="flex:1;" id="adj-zoom-down">A&minus;</button>
              <button class="toolbtn" style="flex:1;" id="adj-zoom-up">A+</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <button class="btn btn-secondary" id="adj-edit" style="width:100%;">Edit song details</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='new-setlist'){
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>New Setlist</h3>
          <div class="field"><label>Name</label><input id="new-sl-name" placeholder="e.g. Sunday Mass Order, or Aug 3 Mass"/></div>
          <div class="field">
            <label>Type</label>
            <div class="cat-toggle-wrap">
              <div class="cat-toggle selected" id="new-sl-type-template" data-sl-type="template">Reusable template</div>
              <div class="cat-toggle" id="new-sl-type-dated" data-sl-type="dated">Dated Mass</div>
            </div>
          </div>
          <div class="field" id="new-sl-date-wrap" style="display:none;">
            <label>Date</label>
            <input id="new-sl-date" type="date"/>
          </div>
          <div class="save-bar" style="padding:0;margin-top:6px;">
            <button class="btn btn-secondary" id="new-sl-cancel">Cancel</button>
            <button class="btn btn-primary" id="new-sl-create">Create</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='rename-setlist'){
    const sl = state.setlists.find(s=>s.id===state.modal.id);
    if(!sl) return '';
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Rename Setlist</h3>
          <div class="field"><label>Name</label><input id="rename-sl-input" value="${escapeHtml(sl.name)}"/></div>
          <div class="save-bar" style="padding:0;margin-top:6px;">
            <button class="btn btn-secondary" id="rename-sl-cancel">Cancel</button>
            <button class="btn btn-primary" id="rename-sl-save">Save</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='add-section'){
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Add Section</h3>
          <div class="quick-insert-row">
            ${['Entrance','Kyrie','Gloria','Responsorial Psalm','Gospel Acclamation','Offertory','Sanctus','Communion','Recessional'].map(s=>`<button type="button" class="quick-chip section-chip" data-quick-section="${s}">${s}</button>`).join('')}
          </div>
          <div class="field"><label>Or type a custom label</label><input id="new-section-input" placeholder="e.g. Opening Prayer"/></div>
          <div class="save-bar" style="padding:0;margin-top:6px;">
            <button class="btn btn-secondary" id="add-section-cancel">Cancel</button>
            <button class="btn btn-primary" id="add-section-save">Add</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='rename-section'){
    const sl = state.setlists.find(s=>s.id===state.modal.setlistId);
    if(!sl) return '';
    const item = sl.items[state.modal.itemIdx];
    if(!item) return '';
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Rename Section</h3>
          <div class="field"><label>Label</label><input id="rename-section-input" value="${escapeHtml(item.label)}"/></div>
          <div class="save-bar" style="padding:0;margin-top:6px;">
            <button class="btn btn-secondary" id="rename-section-cancel">Cancel</button>
            <button class="btn btn-primary" id="rename-section-save">Save</button>
          </div>
        </div>
      </div>`;
  }
  if(state.modal.type==='add-song-to-setlist'){
    const q = (state.modal.search||'').toLowerCase();
    const matches = state.songs.filter(s=>!q || s.title.toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q)).slice(0,40);
    const rows = matches.map(s=>`
      <div class="cat-item" data-pick-song="${s.id}" style="cursor:pointer;">
        <span>${escapeHtml(s.title)}</span>
        <span class="side-count">${escapeHtml(s.key||'')}</span>
      </div>`).join('') || `<div class="hint" style="padding:12px 0;">No songs match.</div>`;
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>Add Song</h3>
          <div class="field"><input id="pick-song-search" placeholder="Search title or artist…" value="${escapeHtml(state.modal.search||'')}"/></div>
          <div class="cat-list" style="max-height:50vh;overflow-y:auto;">${rows}</div>
        </div>
      </div>`;
  }
  if(state.modal.type==='duplicate-setlist'){
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card">
          <h3>Use template for a date</h3>
          <div class="field"><label>Mass date</label><input id="dup-sl-date" type="date"/></div>
          <div class="field"><label>Name for this plan</label><input id="dup-sl-name" value="${escapeHtml((state.setlists.find(s=>s.id===state.modal.id)||{name:''}).name)}"/></div>
          <div class="save-bar" style="padding:0;margin-top:6px;">
            <button class="btn btn-secondary" id="dup-sl-cancel">Cancel</button>
            <button class="btn btn-primary" id="dup-sl-create">Create</button>
          </div>
        </div>
      </div>`;
  }
  return '';
}
function wireModal(){
  const bg = document.getElementById('modal-bg');
  if(!bg) return;
  bg.onclick = (e)=>{ if(e.target===bg){ state.modal=null; render(); } };
  const x = document.getElementById('modal-x');
  if(x) x.onclick = ()=>{ state.modal=null; render(); };
  document.querySelectorAll('.diagram-tabs button').forEach(b=>{
    b.onclick = ()=>{ state.modal.tab = b.dataset.tab; render(); };
  });
  const addBtn = document.getElementById('add-cat-btn');
  if(addBtn) addBtn.onclick = async ()=>{
    const val = document.getElementById('new-cat-input').value.trim();
    if(val && !state.categories.includes(val)){
      state.categories.push(val);
      await Store.saveCategories(state.categories);
      render();
    }
  };
  document.querySelectorAll('[data-del]').forEach(el=>{
    el.onclick = async ()=>{
      const cat = el.dataset.del;
      state.categories = state.categories.filter(c=>c!==cat);
      await Store.saveCategories(state.categories);
      const affected = state.songs.filter(s=>(s.categories||[]).includes(cat));
      for(const s of affected){
        s.categories = s.categories.filter(c=>c!==cat);
        await Store.saveSong(s);
      }
      if(state.filterCat===cat) state.filterCat = 'All';
      render();
    };
  });
  const addMpBtn = document.getElementById('add-mp-btn');
  if(addMpBtn) addMpBtn.onclick = async ()=>{
    const val = document.getElementById('new-mp-input').value.trim();
    if(val && !state.massParts.includes(val)){
      state.massParts.push(val);
      await Store.saveMassParts(state.massParts);
      render();
    }
  };
  document.querySelectorAll('[data-del-mp]').forEach(el=>{
    el.onclick = async ()=>{
      const mp = el.dataset.delMp;
      state.massParts = state.massParts.filter(c=>c!==mp);
      await Store.saveMassParts(state.massParts);
      const affected = state.songs.filter(s=>(s.massParts||[]).includes(mp));
      for(const s of affected){
        s.massParts = s.massParts.filter(c=>c!==mp);
        await Store.saveSong(s);
      }
      if(state.filterMassPart===mp) state.filterMassPart = null;
      render();
    };
  });
  const ctxEdit = document.getElementById('ctx-edit');
  if(ctxEdit) ctxEdit.onclick = ()=>{ const id = state.modal.id; state.modal=null; openEditor(id); };
  const ctxDelete = document.getElementById('ctx-delete');
  if(ctxDelete) ctxDelete.onclick = async ()=>{
    if(confirm('Delete this song? This cannot be undone.')){
      await Store.deleteSong(state.modal.id);
      state.songs = state.songs.filter(s=>s.id!==state.modal.id);
      state.modal = null;
      render();
    }
  };
  document.querySelectorAll('[data-ctx-folder]').forEach(el=>{
    el.onclick = async ()=>{
      const song = state.songs.find(s=>s.id===state.modal.id);
      const cat = el.dataset.ctxFolder;
      song.categories = song.categories || [];
      const idx = song.categories.indexOf(cat);
      if(idx>=0) song.categories.splice(idx,1); else song.categories.push(cat);
      await Store.saveSong(song);
      render();
    };
  });
  const metroBtn = document.getElementById('btn-metro');
  if(metroBtn) metroBtn.onclick = ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    const beatsPerBar = parseInt((song.timeSig||'4/4').split('/')[0]) || 4;
    state.metronomeOn ? stopMetronome() : startMetronome(song.tempo||90, beatsPerBar);
    renderViewer();
  };
  const adjEdit = document.getElementById('adj-edit');
  if(adjEdit) adjEdit.onclick = ()=>{
    const id = state.modal.id; state.modal=null; openEditor(id);
  };
  const adjDown = document.getElementById('adj-down');
  if(adjDown) adjDown.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    song.transposeOffset = (song.transposeOffset||0)-1;
    await Store.saveSong(song); render();
  };
  const adjUp = document.getElementById('adj-up');
  if(adjUp) adjUp.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    song.transposeOffset = (song.transposeOffset||0)+1;
    await Store.saveSong(song); render();
  };
  const adjReset = document.getElementById('adj-reset');
  if(adjReset) adjReset.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    song.transposeOffset = 0;
    await Store.saveSong(song); render();
  };
  const adjZoomUp = document.getElementById('adj-zoom-up');
  if(adjZoomUp) adjZoomUp.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    song.viewerFontSize = Math.min(36, (song.viewerFontSize||15)+2);
    await Store.saveSong(song); render();
  };
  const adjZoomDown = document.getElementById('adj-zoom-down');
  if(adjZoomDown) adjZoomDown.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    song.viewerFontSize = Math.max(10, (song.viewerFontSize||15)-2);
    await Store.saveSong(song); render();
  };

  // ---- new-setlist ----
  const slTypeTemplate = document.getElementById('new-sl-type-template');
  const slTypeDated = document.getElementById('new-sl-type-dated');
  if(slTypeTemplate && slTypeDated){
    const dateWrap = document.getElementById('new-sl-date-wrap');
    slTypeTemplate.onclick = ()=>{
      slTypeTemplate.classList.add('selected'); slTypeDated.classList.remove('selected');
      dateWrap.style.display = 'none';
    };
    slTypeDated.onclick = ()=>{
      slTypeDated.classList.add('selected'); slTypeTemplate.classList.remove('selected');
      dateWrap.style.display = 'block';
    };
  }
  const newSlCancel = document.getElementById('new-sl-cancel');
  if(newSlCancel) newSlCancel.onclick = ()=>{ state.modal=null; render(); };
  const newSlCreate = document.getElementById('new-sl-create');
  if(newSlCreate) newSlCreate.onclick = async ()=>{
    const name = document.getElementById('new-sl-name').value.trim();
    if(!name){ alert('Please enter a name.'); return; }
    const isTemplate = document.getElementById('new-sl-type-dated').classList.contains('selected') ? false : true;
    const date = isTemplate ? null : (document.getElementById('new-sl-date').value || null);
    const sl = { id: uid(), name, isTemplate, date, basedOnTemplateId: null, items: [], dateCreated: Date.now(), dateModified: Date.now() };
    await Store.saveSetlist(sl);
    state.setlists.push(sl);
    state.modal = null;
    state.currentSetlistId = sl.id;
    state.view = 'setlist-editor';
    render();
  };

  // ---- rename-setlist ----
  const renameSlCancel = document.getElementById('rename-sl-cancel');
  if(renameSlCancel) renameSlCancel.onclick = ()=>{ state.modal=null; render(); };
  const renameSlSave = document.getElementById('rename-sl-save');
  if(renameSlSave) renameSlSave.onclick = async ()=>{
    const sl = state.setlists.find(s=>s.id===state.modal.id);
    const val = document.getElementById('rename-sl-input').value.trim();
    if(sl && val){ sl.name = val; await Store.saveSetlist(sl); }
    state.modal = null; render();
  };

  // ---- add-section ----
  document.querySelectorAll('[data-quick-section]').forEach(el=>{
    el.onclick = async ()=>{
      const sl = state.setlists.find(s=>s.id===state.modal.setlistId);
      sl.items.push({ type:'section', id: newSetlistItemId(), label: el.dataset.quickSection });
      await Store.saveSetlist(sl);
      state.modal = null; render();
    };
  });
  const addSectionCancel = document.getElementById('add-section-cancel');
  if(addSectionCancel) addSectionCancel.onclick = ()=>{ state.modal=null; render(); };
  const addSectionSave = document.getElementById('add-section-save');
  if(addSectionSave) addSectionSave.onclick = async ()=>{
    const val = document.getElementById('new-section-input').value.trim();
    if(!val) return;
    const sl = state.setlists.find(s=>s.id===state.modal.setlistId);
    sl.items.push({ type:'section', id: newSetlistItemId(), label: val });
    await Store.saveSetlist(sl);
    state.modal = null; render();
  };

  // ---- rename-section ----
  const renameSectionCancel = document.getElementById('rename-section-cancel');
  if(renameSectionCancel) renameSectionCancel.onclick = ()=>{ state.modal=null; render(); };
  const renameSectionSave = document.getElementById('rename-section-save');
  if(renameSectionSave) renameSectionSave.onclick = async ()=>{
    const sl = state.setlists.find(s=>s.id===state.modal.setlistId);
    const val = document.getElementById('rename-section-input').value.trim();
    if(sl && val){ sl.items[state.modal.itemIdx].label = val; await Store.saveSetlist(sl); }
    state.modal = null; render();
  };

  // ---- add-song-to-setlist ----
  const pickSongSearch = document.getElementById('pick-song-search');
  if(pickSongSearch){
    pickSongSearch.oninput = (e)=>{ state.modal.search = e.target.value; render(); };
  }
  document.querySelectorAll('[data-pick-song]').forEach(el=>{
    el.onclick = async ()=>{
      const sl = state.setlists.find(s=>s.id===state.modal.setlistId);
      sl.items.push({ type:'song', id: newSetlistItemId(), songId: el.dataset.pickSong });
      await Store.saveSetlist(sl);
      state.modal = null; render();
    };
  });

  // ---- duplicate-setlist (template -> dated plan) ----
  const dupSlCancel = document.getElementById('dup-sl-cancel');
  if(dupSlCancel) dupSlCancel.onclick = ()=>{ state.modal=null; render(); };
  const dupSlCreate = document.getElementById('dup-sl-create');
  if(dupSlCreate) dupSlCreate.onclick = async ()=>{
    const template = state.setlists.find(s=>s.id===state.modal.id);
    const name = document.getElementById('dup-sl-name').value.trim() || template.name;
    const date = document.getElementById('dup-sl-date').value || null;
    const copy = {
      id: uid(), name, isTemplate: false, date, basedOnTemplateId: template.id,
      items: template.items.map(it=>({...it, id: newSetlistItemId()})),
      dateCreated: Date.now(), dateModified: Date.now()
    };
    await Store.saveSetlist(copy);
    state.setlists.push(copy);
    state.modal = null;
    state.currentSetlistId = copy.id;
    state.view = 'setlist-editor';
    render();
  };
}

// (2026-07-13) SVG icon helpers (star, music, import, cross); prev: none
function iconStar(filled){
  if(filled) return `<svg viewBox="0 0 24 24" width="16" height="16" fill="var(--chord)" stroke="var(--chord)" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text-dim)" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function iconMusic(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`; }
function iconImport(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`; }
function iconCross(){ return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
function iconSpeedArrows(){ return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 4l-5 6h10l-5-6zm0 16l5-6H7l5 6z"/></svg>`; }
function iconSetlist(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`; }
function iconArrowUp(){ return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`; }
function iconArrowDown(){ return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`; }
function iconCopy(){ return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`; }
function iconBack(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconEdit(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconFolder(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" stroke-width="2"/></svg>`; }
function iconClose(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`; }
function iconPlay(){ return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`; }
function iconMetro(){ return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l6 20H6L12 2z" stroke="currentColor" stroke-width="2"/><path d="M12 10l2 12" stroke="currentColor" stroke-width="2"/></svg>`; }
function iconMenu(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`; }
function iconTrash(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconDots(){ return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`; }
function iconRestart(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconPause(){ return `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`; }
function iconChevronUp(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconChevronDown(){ return `<svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconBigTriangleUp(){ return `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M30 4 L54 34 L6 34 Z" fill="currentColor"/></svg>`; }
function iconBigTriangleDown(){ return `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M30 36 L6 6 L54 6 Z" fill="currentColor"/></svg>`; }

/* ============================================================
   SERVICE WORKER (offline shell caching for fast loads)
   ============================================================ */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{ /* offline caching optional, ignore failures */ });
  });
}

// (2026-07-13) subscribe to live Firestore onSnapshot changes across devices; prev: manual load
let unsubscribeSnapshot = null;
function subscribeRealtimeSync(){
  if(!FIREBASE_READY || !firebaseUser) return;
  if(unsubscribeSnapshot){ unsubscribeSnapshot(); unsubscribeSnapshot = null; }
  try{
    unsubscribeSnapshot = firebase.firestore().collection('users').doc(firebaseUser.uid).collection('data')
      .onSnapshot((snap) => {
        let changed = false;
        snap.docChanges().forEach((change) => {
          const docId = change.doc.id;
          if(change.type === 'removed'){
            LocalAdapter.delete(docId);
            if(docId.startsWith('song:')){
              const id = docId.replace('song:', '');
              state.songs = state.songs.filter(s=>s.id!==id);
              changed = true;
            } else if(docId.startsWith('setlist:')){
              const id = docId.replace('setlist:', '');
              state.setlists = state.setlists.filter(s=>s.id!==id);
              changed = true;
            }
          } else {
            const val = change.doc.data().value;
            LocalAdapter.set(docId, val);
            if(docId.startsWith('song:')){
              try{
                const s = normalizeSong(JSON.parse(val));
                const idx = state.songs.findIndex(item=>item.id===s.id);
                if(idx >= 0) state.songs[idx] = s;
                else state.songs.push(s);
                changed = true;
              }catch(e){}
            } else if(docId.startsWith('setlist:')){
              try{
                const sl = normalizeSetlist(JSON.parse(val));
                const idx = state.setlists.findIndex(item=>item.id===sl.id);
                if(idx >= 0) state.setlists[idx] = sl;
                else state.setlists.push(sl);
                changed = true;
              }catch(e){}
            } else if(docId === 'meta:categories'){
              try{ state.categories = JSON.parse(val); changed = true; }catch(e){}
            } else if(docId === 'meta:massparts'){
              try{ state.massParts = JSON.parse(val); changed = true; }catch(e){}
            }
          }
        });
        if(changed && !state.loading){ render(); }
      }, (err) => { console.warn('Realtime snapshot notice:', err); });
  }catch(e){ console.error('Snapshot error', e); }
}

(async function boot(){
  if(FIREBASE_READY){
    firebase.auth().onAuthStateChanged(async (user)=>{
      firebaseUser = user;
      selectAdapter();
      if(user){
        subscribeRealtimeSync();
        state.view = 'list';
        try{ await seedIfEmpty(); }catch(e){}
        await loadAll();
      } else {
        if(unsubscribeSnapshot){ unsubscribeSnapshot(); unsubscribeSnapshot = null; }
        state.view = 'auth';
        state.loading = false;
        render();
      }
    });
  } else {
    try{ await seedIfEmpty(); }catch(e){}
    await loadAll();
  }
})();

})();
