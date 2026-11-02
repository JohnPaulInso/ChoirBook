(function(){
"use strict";

/* ============================================================
   MUSIC THEORY CONSTANTS
   ============================================================ */
const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm']);

// (2026-07-13) expand chord intervals & regex for 2, 4, 5, sus, M7; prev: basic qualities
const QUALITY_INTERVALS = {
  '':[0,4,7], 'maj':[0,4,7], 'M':[0,4,7], '5':[0,7],
  'm':[0,3,7], 'min':[0,3,7],
  '7':[0,4,7,10], 'maj7':[0,4,7,11], 'M7':[0,4,7,11], 'maj9':[0,4,7,11,2],
  'm7':[0,3,7,10], 'min7':[0,3,7,10], 'm7b5':[0,3,6,10],
  'dim':[0,3,6], 'dim7':[0,3,6,9], 'aug':[0,4,8],
  'sus2':[0,2,7], '2':[0,2,7], 'add2':[0,2,4,7], 'sus4':[0,5,7], 'sus':[0,5,7], '4':[0,5,7],
  '6':[0,4,7,9], 'm6':[0,3,7,9],
  '9':[0,4,7,10,2], 'add9':[0,4,7,2], '11':[0,4,7,10,2,5], '13':[0,4,7,10,2,9]
};

const CHORD_RE = /^([A-G])(#|b)?(maj9|maj7|maj|M7|min7|min|m7b5|dim7|dim|sus2|sus4|sus|aug|add9|add2|m6|m7|m|2|4|5|6|7|9|11|13)?(\/([A-G])(#|b)?)?$/;

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
  const mWrap = /^([>(]*)(.*?)([.)]*)$/.exec(token);
  const pre = mWrap ? mWrap[1] : '', core = mWrap ? mWrap[2] : token, post = mWrap ? mWrap[3] : '';
  if(core.includes('-') && core !== '-'){
    return pre + core.split('-').map(p => transposeToken(p, semis, preferFlat)).join('-') + post;
  }
  const c = parseChord(core);
  if(!c) return token;
  const newRootIdx = (noteIndex(c.root,c.acc) + semis + 120) % 12;
  let out = spellNote(newRootIdx, preferFlat) + c.quality;
  if(c.bassRoot){
    const newBassIdx = (noteIndex(c.bassRoot,c.bassAcc) + semis + 120)%12;
    out += '/' + spellNote(newBassIdx, preferFlat);
  }
  return pre + out + post;
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
  'M':'', 'maj':'', '5':'', 'min':'m', 'min7':'m7', 'm7b5':'dim', 'dim7':'dim', 'M7':'maj7', 'maj9':'maj7',
  '9':'7', 'add9':'', 'add2':'sus2', '2':'sus2', '4':'sus4', 'sus':'sus4', 'm6':'m', '11':'7', '13':'7'
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
// (2026-07-13) require > at index 0 for chord lines & normalize db chords; prev: heuristic
function isRealChordToken(tok){
  const clean = tok.replace(/^[>(<]+|[.)>'+]+$/g, '');
  if(!clean) return false;
  if(clean !== '-' && clean.includes('-')){
    const parts = clean.split('-').filter(Boolean);
    return parts.length > 0 && parts.every(p => CHORD_RE.test(p));
  }
  return CHORD_RE.test(clean);
}
function tokenLooksLikeChord(tok){
  const clean = tok.replace(/^[>(<]+|[.)>'+]+$/g, '');
  return isRealChordToken(tok) || clean==='N.C.' || clean==='%' || clean==='-';
}
function normalizeBodyChordLines(body){
  if(!body) return body;
  return body.split(/\r?\n/).map(line=>{
    const trimmed = line.trim();
    if(!trimmed) return line;
    if(/^[=\-_]{3,}$/.test(trimmed)) return line;
    if(/^([\u27a4>]\s*)?(Priest|Presider|Celebrant)(\/Reader)?\b\s*:?\s*/i.test(trimmed)) return line;
    if(/^([\u2669\u211fR]\s*)?(Response|People|All)\b\s*:?\s*/i.test(trimmed)) return line;
    if(line.startsWith('>')){
      const stripped = line.slice(1).replace(/[<>]/g, '');
      if(isMelodyNoteLine(stripped)) return stripped;
      return '>' + stripped;
    }
    if(line.includes('<') || line.includes('>')){
      return '>' + line.replace(/[<>]/g, '').replace(/\s+$/, '');
    }
    if(/^\[.+\]$/.test(trimmed) || /^\(.+\)$/.test(trimmed)) return line;
    if(/^(Intro|Verse|Chorus|Bridge|Outro|Pre-Chorus|Interlude|Ending|Refrain|I+|IV|V|VI+)[\s:0-9IVX.]*$/i.test(trimmed)) return line;
    if(isMelodyNoteLine(line)) return line.replace(/^>\s?/, '');
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if(tokens.length===0) return line;
    const realCh = tokens.filter(isRealChordToken).length;
    const chordish = tokens.filter(tokenLooksLikeChord).length;
    if(realCh >= 1 && chordish / tokens.length >= 0.6) return '>' + line;
    return line;
  }).join('\n');
}
// (2026-07-13) detect lowercase melody note lines & strip > prefix; prev: missed 1-note lines
function isMelodyNoteLine(line){
  if(!line) return false;
  let cleaned = line.replace(/^>\s*/, '').trim();
  const hasNoteLabel = /^(?:first\s+notes\s*[-:]?|notes?\s*[-:]?|going\s+up\s*[-:]?)\s+/i.test(cleaned);
  cleaned = cleaned.replace(/^(?:first\s+notes\s*[-:]?|notes?\s*[-:]?|going\s+up\s*[-:]?)\s*/i, '').trim();
  if(!cleaned) return false;
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  let lowerNoteCount = 0;
  let noteTokenCount = 0;
  for(const tok of tokens){
    if(tok === '|' || tok === '-') continue;
    if(/^[a-g](#|b)?\.?$/.test(tok)){
      lowerNoteCount++;
      noteTokenCount++;
    } else if(/^[CD](#|b)?\.?$/.test(tok)){
      noteTokenCount++;
    } else {
      return false;
    }
  }
  if(hasNoteLabel && lowerNoteCount >= 1) return true;
  if(noteTokenCount === 1 && lowerNoteCount === 1 && !line.trim().startsWith('>')) return true;
  return noteTokenCount >= 2 && lowerNoteCount >= 1;
}

// (2026-07-13) full-width staff & clear melody letter line; prev: squished staff
function renderMelodyStaffLine(line){
  const rawLine = line.replace(/^> (?=\S)/, '').replace(/^>/, '');
  const prefixMatch = /^(\s*(?:first\s+notes\s*[-:]?|notes?\s*[-:]?|going\s+up\s*[-:]?)\s*)/i.exec(rawLine);
  const startIdx = prefixMatch ? prefixMatch[1].length : 0;
  const stepMap = { 'c': -2, 'd': -1, 'e': 0, 'f': 1, 'g': 2, 'a': 3, 'b': 4, 'C': 5, 'D': 6 };
  const semiMap = { 'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11, 'C': 0, 'D': 2 };
  const re = /(\S+)/g;
  re.lastIndex = startIdx;
  let m;
  const tokens = [];
  while((m = re.exec(rawLine))){
    tokens.push({ tok: m[1], col: m.index });
  }
  const maxCol = Math.max(rawLine.trimEnd().length - 1, 10);
  let itemsHtml = '';
  tokens.forEach((item)=>{
    const { tok, col } = item;
    const ratio = Math.max(0, Math.min(1, col / maxCol));
    if(tok === '|'){
      itemsHtml += `<span class="staff-barline" style="left:calc(30px + (100% - 56px) * ${ratio.toFixed(4)});"></span>`;
      return;
    }
    const nm = /^([a-gCD])(#|b)?\.?$/.exec(tok);
    if(!nm) return;
    const letter = nm[1];
    const acc = nm[2] || '';
    const step = stepMap[letter] !== undefined ? stepMap[letter] : 0;
    const yPx = 26 - step * 3;
    const stemDown = step >= 4;
    let semi = semiMap[letter] || 0;
    if(acc === '#') semi = (semi + 1) % 12;
    if(acc === 'b') semi = (semi + 11) % 12;
    const accSym = acc === '#' ? '&#9839;' : (acc === 'b' ? '&#9837;' : '');
    const ledgerHtml = step <= -2 ? `<span class="staff-ledger" style="top:${yPx + 2}px;"></span>` : '';
    itemsHtml += `
      <span class="staff-note-group" data-staff-note="${semi}" style="left:calc(30px + (100% - 56px) * ${ratio.toFixed(4)});" title="Tap to play ${escapeHtml(tok)}">
        ${ledgerHtml}
        <span class="staff-notehead ${stemDown?'stem-down':'stem-up'}" style="top:${yPx}px;">
          ${accSym ? `<span class="staff-acc">${accSym}</span>` : ''}
          <span class="staff-stem"></span>
        </span>
      </span>`;
  });

  return `
    <div class="melody-staff-section">
      <div class="melody-staff-wrap">
        <div class="melody-staff-lines">
          <span class="staff-line" style="top:2px;"></span>
          <span class="staff-line" style="top:8px;"></span>
          <span class="staff-line" style="top:14px;"></span>
          <span class="staff-line" style="top:20px;"></span>
          <span class="staff-line" style="top:26px;"></span>
        </div>
        <span class="staff-g-clef" aria-hidden="true">&#119070;</span>
        ${itemsHtml}
      </div>
      <div class="melody-letters-line">${escapeHtml(rawLine.replace(/^>/, ''))}</div>
    </div>`;
}

function classifyLine(line){
  const trimmed = line.trim();
  if(trimmed==='') return 'blank';
  if(/^[=\-_]{4,}$/.test(trimmed)) return 'divider';
  if(/^([\u27a4>]\s*)?(Priest|Presider|Celebrant)(\/Reader)?\b\s*:?\s*/i.test(trimmed)) return 'priest';
  if(/^([\u2669\u211fR]\s*)?(Response|People|All)\b\s*:?\s*/i.test(trimmed)) return 'response';
  if(isMelodyNoteLine(line)) return 'melody';
  if(line.startsWith('>')) return 'chord';
  if(/^\[.+\]$/.test(trimmed) || /^\(.+\)$/.test(trimmed)) return 'section';
  if(/^(Intro|Verse|Chorus|Bridge|Outro|Pre-Chorus|Interlude|Ending|Refrain)[\s:0-9IVX]*$/i.test(trimmed)) return 'section';
  if(/^<.+>$/.test(trimmed)) return 'bracket';
  return 'lyric';
}
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
// (2026-07-13) use cross icon for priest & people icon for response; prev: arrow/note
function renderPriestLine(line){
  const m = /^([\u27a4>]\s*)?((?:Priest|Presider|Celebrant)(?:\/Reader)?)\s*:?\s*(.*)$/i.exec(line.trim());
  const role = (m && m[2]) ? m[2] : 'Priest';
  const text = m ? (m[3] || '') : line;
  return `<div class="lyric-line"><span class="dialogue-badge priest-badge">${iconPriestCross()} ${escapeHtml(role)}</span> ${escapeHtml(text)}</div>`;
}
function renderResponseLine(line){
  const m = /^([\u2669\u211fR]\s*)?(Response|People|All)\s*:?\s*(.*)$/i.exec(line.trim());
  const role = (m && m[2]) ? m[2] : 'Response';
  const text = m ? (m[3] || '') : line;
  return `<div class="lyric-line"><span class="dialogue-badge response-badge">${iconPeopleGroup()} ${escapeHtml(role)}</span> ${escapeHtml(text)}</div>`;
}
function renderChordLine(line){
  const cleanedLine = line.replace(/^> (?=\S)/, '').replace(/^>/, '');
  const re = /(\S+)/g;
  let last = 0, out = '';
  let m;
  while((m = re.exec(cleanedLine))){
    out += escapeHtml(cleanedLine.slice(last, m.index));
    const tok = m[1];
    const clean = tok.replace(/^[>(]+|[.)]+$/g, '');
    if(CHORD_RE.test(clean)){
      out += `<span class="chord-tok" data-chord="${escapeHtml(clean)}">${escapeHtml(tok)}</span>`;
    } else if(clean !== '-' && clean.includes('-') && clean.split('-').filter(Boolean).every(p=>CHORD_RE.test(p))){
      out += tok.split('-').map(p=>{
        const cp = p.replace(/^[>(]+|[.)]+$/g, '');
        return CHORD_RE.test(cp) ? `<span class="chord-tok" data-chord="${escapeHtml(cp)}">${escapeHtml(p)}</span>` : escapeHtml(p);
      }).join('-');
    } else {
      out += `<span style="color:var(--chord);font-weight:700;">${escapeHtml(tok)}</span>`;
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(cleanedLine.slice(last));
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
  // (2026-07-13) default categories to empty list for new accounts; prev: Uncategorized
  async getCategories(){
    const r = await adapter.get('meta:categories');
    if(!r) return [];
    try{ return JSON.parse(r.value); }catch(e){ return []; }
  },
  async saveCategories(cats){ await adapter.set('meta:categories', JSON.stringify(cats)); },
  async getMassParts(){
    const r = await adapter.get('meta:massparts');
    if(!r) return null;
    try{ return JSON.parse(r.value); }catch(e){ return null; }
  },
  async saveMassParts(parts){ await adapter.set('meta:massparts', JSON.stringify(parts)); },
  // (2026-07-13) store & load 8-color folder themes; prev: none
  async getFolderColors(){
    const r = await adapter.get('meta:folderColors');
    if(!r) return {};
    try{ return JSON.parse(r.value) || {}; }catch(e){ return {}; }
  },
  async saveFolderColors(colors){ await adapter.set('meta:folderColors', JSON.stringify(colors || {})); },
  // (2026-07-13) persist cue chord spacings to database; prev: localStorage only
  async getCueChords(){
    const r = await adapter.get('meta:cueChordsV2');
    if(!r) return {};
    try{ return JSON.parse(r.value) || {}; }catch(e){ return {}; }
  },
  async saveCueChords(map){ await adapter.set('meta:cueChordsV2', JSON.stringify(map || {})); },
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

// (2026-07-13) add Bisaya mass part cues dictionary; prev: none
// (2026-07-13) clean acoustic piano synth without clipping; prev: clipped 1.85x
let pianoAudioCtx = null, pianoMasterBus = null;
function playPianoNote(noteIdx){
  try{
    if(!pianoAudioCtx) pianoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(pianoAudioCtx.state === 'suspended') pianoAudioCtx.resume();
    if(!pianoMasterBus){
      const comp = pianoAudioCtx.createDynamicsCompressor();
      comp.threshold.value = -3;
      comp.knee.value = 4;
      comp.ratio.value = 12;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      const masterGain = pianoAudioCtx.createGain();
      masterGain.gain.value = 0.85;
      comp.connect(masterGain);
      masterGain.connect(pianoAudioCtx.destination);
      pianoMasterBus = comp;
    }
    const now = pianoAudioCtx.currentTime;
    const freq = 261.6256 * Math.pow(2, (noteIdx % 12) / 12);
    const filter = pianoAudioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 380), now + 1.2);
    filter.Q.value = 1.0;
    filter.connect(pianoMasterBus);

    const partials = [
      { mult: 1, type: 'sine', peak: 0.50, decay: 1.8 },
      { mult: 1, type: 'triangle', peak: 0.18, decay: 1.4 },
      { mult: 2, type: 'sine', peak: 0.16, decay: 1.0 },
      { mult: 3, type: 'sine', peak: 0.06, decay: 0.55 },
      { mult: 4, type: 'sine', peak: 0.02, decay: 0.3 }
    ];
    partials.forEach(p=>{
      const osc = pianoAudioCtx.createOscillator();
      const g = pianoAudioCtx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq * p.mult, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(p.peak, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0005, now + p.decay);
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      osc.stop(now + p.decay + 0.02);
    });
  }catch(e){}
}

// (2026-07-13) default cue chords to sharps instead of flats; prev: preferFlat
function transposeSpacedChordLine(raw, semis, preferFlat = false){
  if(!raw || !semis) return raw;
  let out = '';
  let i = 0;
  while(i < raw.length){
    if(raw[i] === ' '){
      out += ' ';
      i++;
    } else {
      let j = i;
      while(j < raw.length && raw[j] !== ' ') j++;
      const tok = raw.slice(i, j);
      const trans = transposeToken(tok, semis, preferFlat);
      out += trans;
      const diff = trans.length - tok.length;
      i = j;
      if(diff > 0){
        let skip = diff;
        while(skip > 0 && i < raw.length && raw[i] === ' ' && raw[i+1] === ' '){
          i++;
          skip--;
        }
      } else if(diff < 0 && i < raw.length){
        out += ' '.repeat(-diff);
      }
    }
  }
  return out;
}

// (2026-07-13) left-indented cue chords & db-synced spacing overrides; prev: unindented
function getCueChordMap(){
  if(state.cueChords && typeof state.cueChords === 'object') return state.cueChords;
  try{ return JSON.parse(localStorage.getItem('meta:cueChordsV2') || '{}') || {}; }catch(e){ return {}; }
}
function getCueChordText(cueId, fallback){
  const map = getCueChordMap();
  return (cueId && map[cueId] !== undefined) ? map[cueId] : (fallback || '');
}
function saveCueChordText(cueId, val){
  if(!cueId) return;
  const map = Object.assign({}, getCueChordMap());
  map[cueId] = val;
  state.cueChords = map;
  try{ localStorage.setItem('meta:cueChordsV2', JSON.stringify(map)); }catch(e){}
  Store.saveCueChords(map).catch(()=>{});
}

const MASS_PART_CUES = {
  'kyrie': {
    title: 'Pasiuna nga Pag-ampo & Kyrie',
    cues: [
      { id: 'kyrie-0', priest: 'Sa Ngalan Sa Amahan, Sa Anak, Ug Sa Espiritu Santo...', chords: '        D     G  D', response: 'Amen' },
      { id: 'kyrie-1', priest: 'Ang grasya sa atong Ginoong Jesu Cristo... maanaa kaninyo.', chords: '        D     G      A    D', response: 'Maanaa usab kanimo.' },
      { id: 'kyrie-2', priest: 'Maghinulsol kita sa atong mga sala.' }
    ],
    sing: 'Sing the Kyrie / Ginoo Kaloy-i Kami'
  },
  'gloria': {
    title: 'Himaya sa Dios (Gloria)',
    cues: [
      { id: 'gloria-0', priest: 'Himaya sa Dios didto sa langit...' }
    ],
    sing: 'Sing the Gloria',
    postPrayer: { id: 'gloria-post', priest: 'Mag-ampo kita... Dios nga usa hangtod sa kahangturan.', chords: '        D     G  D', response: 'Amen' }
  },
  'responsorial psalm': {
    title: 'Unang Pagbasa & Salmo',
    cues: [
      { id: 'psalm-0', priest: '(1st Reading) Ang Pulong sa Ginoo.', chords: '        D     G          D', response: 'Salamat sa Dios.' }
    ],
    sing: 'Sing the Salmo / Psalm Response'
  },
  'gospel acclamation': {
    title: 'Ikaduhang Pagbasa & Aleluya',
    cues: [
      { id: 'gospel-0', priest: '(2nd Reading) Ang Pulong sa Ginoo.', chords: '        D     G          D', response: 'Salamat sa Dios.' }
    ],
    sing: 'Sing the Aleluya / Gospel Acclamation'
  },
  // (2026-07-13) keep offertory cue concise; prev: included postDialogues
  'offertory': {
    title: 'Pag-andam sa mga Halad (Offertory)',
    cues: [
      { id: 'offertory-0', priest: 'Ginoong Dios, patalinghugi ang... pinaagi ni Cristo among Ginoo. Atong ihalad ang atong mga gasa...' }
    ],
    sing: 'Sing the Offertory Song'
  },
  'sanctus': {
    title: 'Santos (Sanctus)',
    cues: [
      { id: 'sanctus-0', priest: 'Ug busa, uban sa mga Anghel ug sa tanang mga Santos, nag-awit kami sa imong himaya sa walay paghunong nga nagaingon:' }
    ],
    sing: 'Sing the Santos / Holy'
  },
  'memorial acclamation': {
    title: 'Akklamasyon sa Pagtuo',
    cues: [
      { id: 'memorial-0', priest: 'Kini ang misteryo sa pagtuo.' }
    ],
    sing: 'Sing the Memorial Acclamation'
  },
  'great amen': {
    title: 'Doksolohiya & Dako nga Amen',
    cues: [
      { id: 'amen-0', priest: 'Pinaagi kaniya, uban kaniya, ug diha kaniya, ang tanang dungog ug himaya imo, Dios Amahan nga makagagahum sa tanan, uban sa Espiritu Santo, hangtod sa kahangturan.' }
    ],
    sing: 'Sing the Great Amen'
  },
  'our father': {
    title: 'Amahan Namo (The Lord\'s Prayer)',
    cues: [
      { id: 'ourfather-0', priest: 'Sa pagtuman sa sugo sa atong Manunubos ug sumala sa gitudlo sa Dios kanato, mangahas kita sa pag-ingon:' }
    ],
    sing: 'Sing the Lord\'s Prayer / Amahan Namo',
    doxology: {
      priest: 'Mangayo kami kanimo, Ginoo, nga luwason mo kami sa tanang dautan... samtang nagapaabot kami sa bulahang paglaum ug sa pagbalik sa among Manunubos...',
      sing: 'Sing the Doxology (Kay Imo Man ang Gingharian)'
    }
  },
  'lamb of god': {
    title: 'Ang Kalinaw & Kordero sa Dios',
    cues: [
      { id: 'lamb-0', priest: 'Ginoong Jesu Cristo, nag-ingon ka sa imong mga Apostoles: "Kalinaw ibilin ko kaninyo..." Hangtod sa kahangturan.', chords: '        D     G  D', response: 'Amen.' },
      { id: 'lamb-1', priest: 'Ang kalinaw sa Ginoo maanaa kaninyo.', chords: '        D     G      A    D', response: 'Maanaa usab kanimo.' },
      { id: 'lamb-2', priest: 'Ipaambit ta ang kalinaw sa panagigsoonay...' }
    ],
    sing: 'Sing the Lamb of God / Kordero sa Dios',
    communionInvite: {
      priest: 'Mao kini ang Kordero sa Dios nga nagawagtang sa mga sala sa kalibutan. Bulahan ang mga gidapit alang sa bangkete sa Ginoo.',
      response: 'Ginoo, dili ako angay nga mokalawat kanimo, apan ipamulong lamang ug mamaayo ako. (bell)',
      priest2: 'Ang lawas ni Cristo.',
      response2: 'Amen.'
    }
  },
  'communion': {
    title: 'Pangalawat (Communion)',
    cues: [
      { id: 'comm-0', priest: 'Mao kini ang Kordero sa Dios nga nagawagtang sa mga sala sa kalibutan. Bulahan ang mga gidapit alang sa bangkete sa Ginoo.', response: 'Ginoo, dili ako angay nga mokalawat kanimo, apan ipamulong lamang ug mamaayo ako. (bell)' },
      { id: 'comm-1', priest: 'Ang lawas ni Cristo.', chords: '        D     G  D', response: 'Amen.' }
    ],
    sing: 'Sing the Communion Song / Pangalawat',
    postPrayer: { id: 'comm-post', priest: 'Mag-ampo kita... (Pag-ampo human sa Pangalawat)... hangtod sa kahangturan.', chords: '        D     G  D', response: 'Amen.' }
  },
  'recessional': {
    title: 'Panapos nga Rito (Concluding Rites)',
    cues: [
      { id: 'rec-0', priest: 'Mag-ampo kita... (Pag-ampo human sa Pangalawat)... hangtod sa kahangturan.', chords: '        D     G  D', response: 'Amen.' },
      { id: 'rec-1', priest: 'Ang Ginoo maanaa kaninyo.', chords: '        D     G      A    D', response: 'Maanaa usab kanimo.' },
      { id: 'rec-2', priest: 'Manalangin kaninyo ang Dios nga makagagahum sa tanan, ang Amahan, ug ang Anak, ug ang Espiritu Santo.', chords: '        D     G  D', response: 'Amen.' },
      { id: 'rec-3', priest: 'Tapos na ang Misa. Lakaw kamo diha sa kalinaw ni Cristo.', chords: '        D     G          D', response: 'Salamat sa Dios.' }
    ],
    sing: 'Sing the Recessional Song / Panapos nga Awit'
  },
  'entrance': {
    title: 'Pasiuna nga Awit (Entrance)',
    cues: [
      { id: 'ent-0', priest: 'Bell Rings / Pagtindog sa tanan alang sa Pasiuna nga Awit' }
    ],
    sing: 'Sing the Entrance Song / Pasiunang Awit'
  }
};

function findMassPartCue(name){
  if(!name) return null;
  const n = name.toLowerCase().trim();
  if(MASS_PART_CUES[n]) return MASS_PART_CUES[n];
  if(n.includes('kyrie') || n.includes('ginoo')) return MASS_PART_CUES['kyrie'];
  if(n.includes('gloria') || n.includes('himaya')) return MASS_PART_CUES['gloria'];
  if(n.includes('psalm') || n.includes('salmo')) return MASS_PART_CUES['responsorial psalm'];
  if(n.includes('alleluia') || n.includes('aleluya') || n.includes('acclamation')) return MASS_PART_CUES['gospel acclamation'];
  if(n.includes('offertory') || n.includes('halad')) return MASS_PART_CUES['offertory'];
  if(n.includes('sanctus') || n.includes('santos') || n.includes('holy')) return MASS_PART_CUES['sanctus'];
  if(n.includes('memorial') || n.includes('misteryo')) return MASS_PART_CUES['memorial acclamation'];
  if(n.includes('amen')) return MASS_PART_CUES['great amen'];
  if(n.includes('father') || n.includes('amahan')) return MASS_PART_CUES['our father'];
  if(n.includes('lamb') || n.includes('kordero') || n.includes('peace') || n.includes('kalinaw')) return MASS_PART_CUES['lamb of god'];
  if(n.includes('communion') || n.includes('kalawat') || n.includes('pangalawat')) return MASS_PART_CUES['communion'];
  if(n.includes('recessional') || n.includes('panapos') || n.includes('exit')) return MASS_PART_CUES['recessional'];
  if(n.includes('entrance') || n.includes('pasiuna') || n.includes('opening')) return MASS_PART_CUES['entrance'];
  return null;
}

/* ============================================================
   APP STATE
   ============================================================ */
const state = {
  view: 'list', // list | viewer | editor | auth
  skippedAuth: false,
  songs: [],
  // (2026-07-13) empty default categories & add profileMenuOpen; prev: ['Uncategorized']
  categories: [],
  folderColors: {},
  showChipColorPicker: false,
  listEditMode: false,
  checkedSongIds: [],
  profileMenuOpen: false,
  massParts: DEFAULT_MASS_PARTS.slice(),
  // (2026-07-13) default loading to false for instant view; prev: loading: true
  loading: false,
  authChecked: false,
  search: '',
  // (2026-07-13) default sortBy to massflow order; prev: sortBy: 'title'
  sortBy: 'massflow',
  filterCat: 'All',
  filterMassPart: null, // when set, list view is browsing by mass part instead of folder
  sidebarOpen: false,
  currentId: null,
  editingDraft: null,
  // (2026-07-13) default autoscroll to on; prev: autoscroll: false
  autoscroll: true,
  metronomeOn: false,
  // (2026-07-13) add viewer cue card and mass part selection state; prev: none
  selectedViewerMassPart: null,
  hideCueCard: false,
  hideDoxology: false,
  hideOptionalCommunionLit: false,
  modal: null,
  longPressTimer: null,
  setlists: [],
  currentSetlistId: null,
  editingSetlistDraft: null,
  cameFromSetlistId: null // when set, the song viewer's back button returns to this setlist instead of the main list
};

// (2026-07-13) tone down 8 folder themes & text accents to muted hues; prev: bright accents
const FOLDER_THEMES = {
  gold:   { key:'gold',   label:'Gold',   swatch:'#d99b52', bg:'#0a0a0e', elev:'#13141a', elev2:'#1c1e26', elev3:'#252832', line:'#2c2f3b', accent:'#d99b52', dim:'rgba(217,155,82,0.14)' },
  green:  { key:'green',  label:'Green',  swatch:'#5ea87a', bg:'#090c0b', elev:'#111614', elev2:'#19201d', elev3:'#212a26', line:'#27322d', accent:'#68b384', dim:'rgba(104,179,132,0.14)' },
  purple: { key:'purple', label:'Purple', swatch:'#9d7cd8', bg:'#0a090e', elev:'#14121b', elev2:'#1d1b27', elev3:'#262333', line:'#2e2a3d', accent:'#a587dc', dim:'rgba(165,135,220,0.14)' },
  blue:   { key:'blue',   label:'Blue',   swatch:'#619fd6', bg:'#090b0f', elev:'#11151d', elev2:'#191f2a', elev3:'#212937', line:'#283142', accent:'#6ba7dc', dim:'rgba(107,167,220,0.14)' },
  red:    { key:'red',    label:'Red',    swatch:'#c96b75', bg:'#0c090b', elev:'#161215', elev2:'#201a1e', elev3:'#2a2227', line:'#32292f', accent:'#cf7680', dim:'rgba(207,118,128,0.14)' },
  white:  { key:'white',  label:'White',  swatch:'#b8c0cc', bg:'#0e1015', elev:'#171a21', elev2:'#20242d', elev3:'#292e39', line:'#323845', accent:'#c2cad6', dim:'rgba(194,202,214,0.13)' },
  pink:   { key:'pink',   label:'Pink',   swatch:'#c4729b', bg:'#0c090c', elev:'#161216', elev2:'#201a20', elev3:'#2a222a', line:'#322932', accent:'#cb7ea4', dim:'rgba(203,126,164,0.14)' },
  yellow: { key:'yellow', label:'Yellow', swatch:'#c9b158', bg:'#0b0b09', elev:'#151411', elev2:'#1f1e19', elev3:'#292721', line:'#312f28', accent:'#cfb864', dim:'rgba(207,184,100,0.14)' }
};

function getFolderTheme(catName){
  const key = (state.folderColors && state.folderColors[catName]) || 'gold';
  return FOLDER_THEMES[key] || FOLDER_THEMES.gold;
}

function applyFolderTheme(catName){
  const t = getFolderTheme(catName || state.filterCat || 'All');
  const root = document.documentElement;
  if(!root) return;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--bg-elev', t.elev);
  root.style.setProperty('--bg-elev2', t.elev2);
  root.style.setProperty('--bg-elev3', t.elev3);
  root.style.setProperty('--line', t.line);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-dim', t.dim);
}

// (2026-07-13) block image drag and non-input text drag globally; prev: none
if(typeof document !== 'undefined'){
  document.addEventListener('dragstart', e=>{
    if(e.target && (e.target.tagName==='IMG' || !e.target.closest('[data-draggable-row]'))) e.preventDefault();
  });
}

// (2026-07-13) hydrate local cache immediately for 0ms startup; prev: loading true wait
try{
  const rawFc = localStorage.getItem('meta:folderColors');
  if(rawFc) state.folderColors = JSON.parse(rawFc) || {};
  applyFolderTheme(state.filterCat);
  const initCached = [];
  for(let i=0; i<localStorage.length; i++){
    const k = localStorage.key(i);
    if(k && k.startsWith('song:')){
      const v = localStorage.getItem(k);
      if(v) try{ initCached.push(JSON.parse(v)); }catch(e){}
    }
  }
  if(initCached.length > 0){
    state.songs = initCached.map(normalizeSong);
    state.loading = false;
  }
}catch(e){}

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
  if(!Array.isArray(song.excludedFolders)) song.excludedFolders = [];
  if(song.body){
    const nextBody = normalizeBodyChordLines(song.body);
    if(nextBody !== song.body){
      song.body = nextBody;
      song._chordPrefixMigrated = true;
    }
  }
  return song;
}

// (2026-07-13) migrate existing db song chord lines to start with >; prev: no migration
async function persistMigratedChordSongs(){
  for(const s of state.songs){
    if(s && s._chordPrefixMigrated){
      delete s._chordPrefixMigrated;
      try{ await Store.saveSong(s); }catch(e){}
    }
  }
}

// (2026-07-13) instant load from local cache with timeout protection; prev: un-timed network wait
async function loadAll(){
  try{
    const cachedItems = await LocalAdapter.getAll('song:');
    if(cachedItems && cachedItems.length > 0){
      state.songs = cachedItems.map(it=>{
        try{ return normalizeSong(JSON.parse(it.value)); }catch(e){ return null; }
      }).filter(Boolean);
      persistMigratedChordSongs();
      state.categories = await Store.getCategories();
      state.folderColors = await Store.getFolderColors();
      state.cueChords = await Store.getCueChords();
      applyFolderTheme(state.filterCat);
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
      Store.getAllSetlists(),
      Store.getFolderColors(),
      Store.getCueChords()
    ]);
    const [rawSongs, cats, parts, rawSetlists, fColors, cChords] = await Promise.race([dataFetch, timeout]);
    if(rawSongs && rawSongs.length > 0){
      state.songs = rawSongs.map(normalizeSong);
      persistMigratedChordSongs();
    }
    // (2026-07-13) sync liturgical dialogue sections & metadata; prev: add if missing
    syncLiturgicalDialogues(true);
    if(cats) state.categories = cats;
    if(parts) state.massParts = parts;
    if(fColors) state.folderColors = fColors;
    if(cChords) state.cueChords = cChords;
    applyFolderTheme(state.filterCat);
    if(rawSetlists) state.setlists = rawSetlists.map(normalizeSetlist);
  }catch(err){
    console.warn('Network sync timed out or offline, using local data');
  }

    state.loading = false;
    render();
    syncBundledGSMA();
  }

function normalizeSetlist(sl){
  if(!Array.isArray(sl.items)) sl.items = [];
  if(sl.isTemplate===undefined) sl.isTemplate = !sl.date;
  if(sl.date===undefined) sl.date = null;
  if(sl.basedOnTemplateId===undefined) sl.basedOnTemplateId = null;
  return sl;
}

// (2026-07-13) left-indented chord rows in liturgical dialogues; prev: unindented chords
function getLiturgicalDialogueSongs(){
  return [
    {
      id: 'lit-collect', title: 'Pag-ampo human sa Gloria (Collect Prayer)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 75,
      timeSig: '4/4', style: 'Chant', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Gloria'],
      sectionTitle: 'Pag-ampo human sa Gloria \u2022 Before Psalm',
      anchorPart: 'Gloria', anchorPos: 'after', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 7000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Pag-ampo human sa Gloria / Collect Prayer)
\u27a4 Priest: Mag-ampo kita... Dios nga usa hangtod sa kahangturan.
>        D     G  D
\u2669 Response: Amen.`
    },
    {
      id: 'lit-ebanghelyo', title: 'Ebanghelyo (Gospel Dialogue & Acclamation)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 75,
      timeSig: '4/4', style: 'Chant', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Gospel Acclamation'],
      sectionTitle: 'Ebanghelyo (Gospel) \u2022 After Gospel Acclamation',
      anchorPart: 'Gospel Acclamation', anchorPos: 'after', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 6000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Pasiuna sa Ebanghelyo / Gospel Acclamation)
\u27a4 Priest: Ang Ginoo maanaa kaninyo.
>        D     G      A    D
\u2669 Response: Maanaa usab kanimo.

\u27a4 Priest: Ang Santos nga Ebanghelyo sumala ni San [N.].
>        D     G        A     D
\u2669 Response: Himayaon ikaw, O Ginoo.
------------------------------------
(Human sa Ebanghelyo / Conclusion)
\u27a4 Priest: Ang Ebanghelyo sa Ginoo.
>        D     G         A     D
\u2669 Response: Daygon ko ikaw, O Cristo.`
    },
    {
      id: 'lit-faithful', title: 'Homilia, Kredo & Pag-ampo sa Katilingban', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 70,
      timeSig: '4/4', style: 'Liturgy', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Offertory'],
      sectionTitle: 'Kredo & Pag-ampo sa Katilingban \u2022 Before Offertory',
      anchorPart: 'Offertory', anchorPos: 'before', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 5000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Homily / Homilia)
------------------------------------
(Kredo / Pagpadayag sa Pagtuo)
\u211f Response: Nagatoo ako... ug sa kinabuhing dayon. Amen.
------------------------------------
(Pag-ampo sa Katilingban / Prayers of the Faithful)
\u27a4 Priest/Reader: Mag-ampo kita sa Ginoo.
\u211f Response: Dungga ang among pag-ampo. (o sumala sa tubag)`
    },
    {
      id: 'lit-eucharist', title: 'Liturhiya sa Eukaristiya (Preparation of the Gifts)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 70,
      timeSig: '4/4', style: 'Liturgy', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Offertory'],
      sectionTitle: 'Liturhiya sa Eukaristiya \u2022 Before Preface',
      anchorPart: 'Offertory', anchorPos: 'after', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 4000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Liturhiya sa Eukaristiya / Preparation of the Gifts)
\u27a4 Priest: Daygon ikaw, Ginoong Dios sa tanang kalibutan...
\u211f Response: Daygon ang Dios hangtod sa kahangturan.

\u27a4 Priest: Pag-ampo kamo, mga igsoon, aron kining akong halad ug ang inyo dawaton unta sa Dios Amahan nga makagagahum sa tanan.

\u211f Response: Dawaton unta sa Ginoo ang halad gikan sa imong mga kamot alang sa pagdayeg ug paghimaya sa iyang ngalan, alang usab sa atong kapuslanan ug sa tibuok niyang Santos nga Simbahan.`
    },
    {
      id: 'lit-preface', title: 'Pasiuna nga Pag-ampo (Preface Dialogue)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 75,
      timeSig: '4/4', style: 'Chant', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Sanctus'],
      sectionTitle: 'Pasiuna nga Pag-ampo (Preface) \u2022 Before Sanctus',
      anchorPart: 'Sanctus', anchorPos: 'before', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 3000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Pag-ampo ibabaw sa mga Halad)
\u27a4 Priest: (Pag-ampo ibabaw sa mga Halad)... hangtod sa kahangturan.
>        D     G  D
\u2669 Response: Amen.
------------------------------------
(Pasiuna nga Pag-ampo / Preface Dialogue)
\u27a4 Priest: Ang Ginoo maanaa kaninyo.
>        B     D      G    A   D
\u2669 Response: Maanaa usab kanimo.

\u27a4 Priest: Ibayaw ang inyong mga kasingkasing.
>        B     D        G       A         D
\u2669 Response: Amo nang gibayaw ngadto sa Ginoo.

\u27a4 Priest: Magpasalamat kita sa Ginoo nga atong Dios.
>        A     D     G  A   D
\u2669 Response: Angay ug matarung.`
    },
    {
      id: 'lit-communion-invite', title: 'Pangalawat (Invitation to Communion)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 70,
      timeSig: '4/4', style: 'Liturgy', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Communion'],
      sectionTitle: 'Pangalawat Dialogue \u2022 Before Communion',
      anchorPart: 'Communion', anchorPos: 'before', optionalLit: true, litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 2000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Pangalawat / Invitation to Communion)
\u27a4 Priest: Mao kini ang Kordero sa Dios nga nagawagtang sa mga sala sa kalibutan. Bulahan ang mga gidapit alang sa bangkete sa Ginoo.

\u211f Response: Ginoo, dili ako angay nga mokalawat kanimo, apan ipamulong lamang ug mamaayo ako. (bell)

\u27a4 Priest: Ang lawas ni Cristo.
\u211f Response: Amen.`
    },
    {
      id: 'lit-concluding', title: 'Panapos nga Rito (Concluding Rites & Dismissal)', artist: 'Misal Romano (Bisaya)', key: 'D', capo: 0, tempo: 75,
      timeSig: '4/4', style: 'Chant', instrument: 'Guitar / Vocal', categories: [],
      massParts: ['Recessional'],
      sectionTitle: 'Panapos nga Rito (Concluding Rites) \u2022 Before Recessional',
      anchorPart: 'Recessional', anchorPos: 'before', litVersion: 3,
      favorite: false, transposeOffset: 0, dateAdded: Date.now() - 1000,
      viewerFontSize: 15, viewerScrollSpeed: 30,
      body:
`(Pag-ampo human sa Pangalawat)
\u27a4 Priest: Mag-ampo kita... (Pag-ampo human sa Pangalawat)... hangtod sa kahangturan.
>        D     G  D
\u2669 Response: Amen.
====================================
(Panapos nga Rito / Concluding Rites)
Manindog alang sa panalangin.

\u27a4 Priest: Ang Ginoo maanaa kaninyo.
>        D     G      A    D
\u2669 Response: Maanaa usab kanimo.

\u27a4 Priest: Manalangin kaninyo ang Dios nga makagagahum sa tanan, ang Amahan, ug ang Anak, ug ang Espiritu Santo.
>        D     G  D
\u2669 Response: Amen.

\u27a4 Priest: Tapos na ang Misa. Lakaw kamo diha sa kalinaw ni Cristo.
>        G     D          G
\u2669 Response: Salamat sa Dios.`
    }
  ];
}

// (2026-07-13) purge seeded default songs & sync liturgical dialogues; prev: sync only
function isSeededDefaultSong(s){
  if(!s) return false;
  if(!s.importedGuid && s.artist === 'Traditional' && (s.title === 'Amazing Grace' || s.title === 'Anima Christi')) return true;
  if(/^[0-9S]+\s*\|?\s*-*[=\u2550\-]{3,}/i.test(s.title || '')) return true;
  return false;
}

function syncLiturgicalDialogues(persist){
  const toRemove = state.songs.filter(isSeededDefaultSong);
  if(toRemove.length > 0){
    state.songs = state.songs.filter(s=>!isSeededDefaultSong(s));
    toRemove.forEach(s=>{
      LocalAdapter.delete('song:'+s.id);
      if(persist) Store.deleteSong(s.id).catch(()=>{});
    });
  }
  const litSongs = getLiturgicalDialogueSongs();
  litSongs.forEach(ls=>{
    const existing = state.songs.find(s=>s.id===ls.id);
    if(!existing){
      state.songs.push(ls);
      if(persist) Store.saveSong(ls).catch(()=>{});
    } else {
      existing.sectionTitle = ls.sectionTitle;
      existing.anchorPart = ls.anchorPart;
      existing.anchorPos = ls.anchorPos;
      existing.optionalLit = ls.optionalLit;
      if((!existing.userEdited && existing.litVersion !== 3) || existing.title !== ls.title){
        existing.title = ls.title;
        if(!existing.userEdited) existing.body = ls.body;
        existing.litVersion = 3;
        if(persist) Store.saveSong(existing).catch(()=>{});
      }
    }
  });
}
if(state.songs.length > 0) syncLiturgicalDialogues(false);

// (2026-07-13) remove default sample songs from seedIfEmpty; prev: seeded 2 samples
async function seedIfEmpty(){
  const keys = await Store.listSongs();
  if(keys.length===0){
    for(const ls of getLiturgicalDialogueSongs()){
      await Store.saveSong(ls);
    }
  }
}

/* ============================================================
   RENDER
   ============================================================ */
const app = document.getElementById('app');
// (2026-07-13) render view directly without loading spinner; prev: loading check
function render(){
  if(state.view==='auth') return renderAuthView();
  if(state.view==='list') return renderListView();
  if(state.view==='viewer') return renderViewer();
  if(state.view==='editor') return renderEditor();
  if(state.view==='setlists') return renderSetlistsView();
  if(state.view==='setlist-editor') return renderSetlistEditor();
}
// (2026-07-13) mandatory Google login screen without offline skip; prev: skip auth button
// (2026-07-13) add guest sign-in & offline fallback; prev: Google sign-in only
// (2026-07-13) revamped auth view with email/guest for mobile APK; prev: basic
function renderAuthView(){
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <img src="./icons/icon-512.png" alt="Choir Book Pro" class="auth-logo"/>
        <h1 class="auth-title">Choir Book Pro</h1>
        <div class="auth-subtitle">Liturgical Hymnal &amp; Mass Planner</div>
        <div class="auth-error" id="auth-error" style="display:none;"></div>
        <button type="button" class="btn-google" id="btn-google-signin">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          <span>Continue with Google</span>
        </button>
        <div class="auth-divider"><span>OR WITH EMAIL</span></div>
        <form class="auth-form" id="auth-email-form" onsubmit="return false;">
          <input type="email" class="auth-input" id="auth-email" placeholder="Email address" autocomplete="email"/>
          <input type="password" class="auth-input" id="auth-password" placeholder="Password (min 6 chars)" autocomplete="current-password"/>
          <div class="auth-actions">
            <button type="submit" class="btn btn-primary" id="btn-email-signin">Sign In</button>
            <button type="button" class="btn btn-secondary" id="btn-email-signup">Register</button>
          </div>
        </form>
        <button type="button" class="auth-guest-btn" id="btn-guest-signin">Continue as Guest (Offline Mode) &rarr;</button>
      </div>
    </div>
  `;

  const errBox = document.getElementById('auth-error');
  const showAuthError = (msg)=>{
    if(!errBox) return;
    errBox.textContent = msg;
    errBox.style.display = 'block';
  };

  const googleBtn = document.getElementById('btn-google-signin');
  if(googleBtn){
    googleBtn.onclick = async ()=>{
      if(errBox) errBox.style.display = 'none';
      // (2026-07-13) native Google One Tap on mobile APK without browser; prev: popup
      if(window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('GoogleOneTap')){
        try{
          const res = await window.Capacitor.Plugins.GoogleOneTap.signIn();
          if(res && res.idToken){
            const cred = firebase.auth.GoogleAuthProvider.credential(res.idToken);
            await firebase.auth().signInWithCredential(cred);
            return;
          }
        }catch(err){
          const msg = (err && (err.message || err.toString())) || '';
          if(!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('dismiss')){
            showAuthError(msg || 'Google One Tap sign-in failed.');
          }
          return;
        }
      }
      try{
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
      }catch(e){
        if(e && (e.code === 'auth/operation-not-supported-in-this-environment' || e.code === 'auth/popup-blocked' || e.code === 'auth/disallowed_useragent')){
          try{
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithRedirect(provider);
          }catch(err){
            showAuthError('Google sign-in is restricted in this environment. Please sign in with Email or continue as Guest.');
          }
        } else {
          showAuthError(e.message || 'Google sign-in failed. Please try again.');
        }
      }
    };
  }

  const emailForm = document.getElementById('auth-email-form');
  const emailInp = document.getElementById('auth-email');
  const passInp = document.getElementById('auth-password');

  if(emailForm){
    emailForm.onsubmit = async (ev)=>{
      ev.preventDefault();
      if(errBox) errBox.style.display = 'none';
      const email = (emailInp ? emailInp.value : '').trim();
      const password = (passInp ? passInp.value : '').trim();
      if(!email || !password){
        showAuthError('Please enter both email and password.');
        return;
      }
      try{
        await firebase.auth().signInWithEmailAndPassword(email, password);
      }catch(e){
        showAuthError(e.message || 'Failed to sign in. Check your credentials.');
      }
    };
  }

  const signupBtn = document.getElementById('btn-email-signup');
  if(signupBtn){
    signupBtn.onclick = async ()=>{
      if(errBox) errBox.style.display = 'none';
      const email = (emailInp ? emailInp.value : '').trim();
      const password = (passInp ? passInp.value : '').trim();
      if(!email || !password){
        showAuthError('Please enter an email and password to create an account.');
        return;
      }
      if(password.length < 6){
        showAuthError('Password must be at least 6 characters.');
        return;
      }
      try{
        await firebase.auth().createUserWithEmailAndPassword(email, password);
      }catch(e){
        showAuthError(e.message || 'Registration failed. Please try again.');
      }
    };
  }

  const guestBtn = document.getElementById('btn-guest-signin');
  if(guestBtn){
    guestBtn.onclick = async ()=>{
      if(errBox) errBox.style.display = 'none';
      try{
        if(typeof firebase !== 'undefined' && firebase.auth){
          await firebase.auth().signInAnonymously();
        } else {
          state.view = 'list'; state.loading = false; render();
          try{ await seedIfEmpty(); }catch(e){}
          loadAll().catch(()=>{});
        }
      }catch(e){
        state.view = 'list'; state.loading = false; render();
        try{ await seedIfEmpty(); }catch(e){}
        loadAll().catch(()=>{});
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

// (2026-07-13) infer mass part for mass & misa de gallo codes; prev: mass codes
function inferMassPartFromGsmaTitle(title){
  if(!title) return [];
  if(/\bkyrie\b/i.test(title)) return ['Kyrie'];
  if(/\b(gloria|himaya)\b/i.test(title)) return ['Gloria'];
  if(/\b(salmo|psalm)\b/i.test(title)) return ['Responsorial Psalm'];
  if(/\b(aleluya|alleluia)\b/i.test(title)) return ['Gospel Acclamation'];
  if(/\b(offertory|halad)\b/i.test(title)) return ['Offertory'];
  if(/\b(sanctus|santos)\b/i.test(title)) return ['Sanctus'];
  if(/\bmanluluwas\b/i.test(title)) return ['Memorial Acclamation'];
  if(/\bamahan\s+namo\b/i.test(title)) return ['Our Father'];
  if(/\b(agnus|kordero|cordero)\b/i.test(title)) return ['Lamb of God'];
  if(/\b(communion|magnificat)\b/i.test(title)) return ['Communion'];
  const m = /^\s*0?(\d{1,4})\s*(?:\||\s)/.exec(title);
  if(!m) return [];
  const code = m[1];
  if(code==='0' || code==='10' || code==='11' || code==='711') return ['Entrance'];
  if(code==='12' || code==='712') return ['Kyrie'];
  if(code==='13' || code==='130') return ['Gloria'];
  if(code==='14' || code==='140') return ['Responsorial Psalm'];
  if(code==='21' || code==='22') return ['Gospel Acclamation'];
  if(code==='23' || code==='231' || code==='51') return ['Offertory'];
  if(code==='24' || code==='240' || code==='243' || code==='61' || code==='715') return ['Sanctus'];
  if(code==='31' || code==='62') return ['Memorial Acclamation'];
  if(code==='32' || code==='320' || code==='63') return ['Other'];
  if(code==='33' || code==='64') return ['Our Father'];
  if(code==='34' || code==='340' || code==='350' || code==='65' || code==='717') return ['Lamb of God'];
  if(code==='41' || code==='71' || code==='72') return ['Communion'];
  if(code==='42' || code==='421' || code==='718' || code==='719' || code==='91') return ['Recessional'];
  return [];
}

function parseGSMA(text, overrideFolder){
  const blocks = text.split(/(?=^author\s*=\s*")/m).filter(b=>b.trim());
  let folderName = overrideFolder || 'Imported';
  const songs = [];
  const seenTitles = new Set();

  blocks.forEach(block=>{
    const lines = block.split(/\r?\n/);
    const header = {};
    let i = 0;
    while(i < lines.length){
      const m = /^(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*;\s*$/.exec(lines[i]);
      if(m){ header[m[1]] = m[2]; i++; }
      else break;
    }
    if(!header.song) return;
    if(/^[0-9S]+\s*\|?\s*-*[=\u2550\-]{3,}/i.test(header.song.trim())) return;

    if(!overrideFolder && header.author){
      const rawAuthor = header.author.trim();
      if(/^misa\s*de\s*gallo/i.test(rawAuthor)){
        folderName = (state.categories && state.categories.find(c => /misa\s*de\s*gallo/i.test(c))) || 'Misa de Gallo Songs';
      } else if(rawAuthor){
        folderName = rawAuthor;
      }
    }

    const cleanTitle = header.song.trim();
    if(seenTitles.has(cleanTitle.toLowerCase())) return;
    seenTitles.add(cleanTitle.toLowerCase());

    let bodyLines = lines.slice(i);
    while(bodyLines.length && (bodyLines[bodyLines.length-1].trim()==='' || bodyLines[bodyLines.length-1].trim()==='.')){
      bodyLines.pop();
    }
    let body = bodyLines.join('\n');

    let tempo = null;
    const tempoMatch = /^[ \t]*tempo[ \t]+(\d+)[ \t]*$/im.exec(body);
    if(tempoMatch){
      tempo = parseInt(tempoMatch[1]) || null;
      body = body.replace(/^[ \t]*tempo[ \t]+\d+[ \t]*\n?/im, '');
    }

    let referenceUrl = '';
    const ytMatch = /^[ \t]*yt:[ \t]*(\S+)[ \t]*$/im.exec(body);
    if(ytMatch){
      referenceUrl = ytMatch[1];
      body = body.replace(/^[ \t]*yt:[ \t]*\S+[ \t]*\n?/im, '');
    }

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
    if(massParts.length === 0){
      massParts = inferMassPartFromGsmaTitle(cleanTitle);
    }
    body = bodyLineArr.join('\n');

    // (2026-07-13) keep > prefix on chord lines when parsing gsma; prev: stripped [<>]
    body = normalizeBodyChordLines(body);
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    songs.push({
      title: cleanTitle,
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

// (2026-07-13) export songs to standard .gsma format & trigger download; prev: none
function generateGSMA(songs, defaultAuthor){
  return songs.map(s=>{
    const author = defaultAuthor || (Array.isArray(s.categories) && s.categories[0]) || 'Choir Book Pro';
    const sGuid = s.importedGuid || uid();
    const aGuid = uid();
    const title = (s.title || 'Untitled').replace(/"/g, '\\"');
    const authorEsc = author.replace(/"/g, '\\"');
    const delay = s.scrollDelay || 7;
    const duration = s.viewerScrollSpeed || 30;
    let extra = '';
    if(s.tempo) extra += `tempo ${s.tempo}\n`;
    if(s.referenceUrl) extra += `yt: ${s.referenceUrl}\n`;
    return `author="${authorEsc}";\nauthorguid="${aGuid}";\nsongguid="${sGuid}";\nsystem="false";\nsong="${title}";\ndelay="${delay}";\nduration="${duration}";\nsender="";\n${extra}${s.body || ''}\n`;
  }).join('\n');
}
function downloadGSMA(filename, content){
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.gsma') ? filename : `${filename}.gsma`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

// (2026-07-13) sync bundled mass & misa de gallo gsma files; prev: mass songs only
let bundledGsmaSynced = false;
async function syncBundledGSMA(){
  if(bundledGsmaSynced) return;
  bundledGsmaSynced = true;
  const misaFolder = state.categories.find(c => /misa\s*de\s*gallo/i.test(c)) || 'Misa de Gallo Songs';
  const bundles = [
    { url: './MASS%20SONGS%20BOGO%20-%20JPI.gsma', folder: null },
    { url: './MISA%20DE%20GALLO%20BOGO%20CEBU%20-%20JPI.gsma', folder: misaFolder }
  ];
  let changed = false;
  for(const b of bundles){
    try{
      const res = await fetch(b.url);
      if(!res.ok) continue;
      const text = await res.text();
      const { folderName, songs } = parseGSMA(text, b.folder);
      if(!songs.length) continue;
      if(folderName && !state.categories.includes(folderName)){
        state.categories.push(folderName);
        await Store.saveCategories(state.categories);
        changed = true;
      }
      const baseTime = Date.now();
      for(let i=0; i<songs.length; i++){
        const incoming = songs[i];
        const existingIdx = incoming.importedGuid
          ? state.songs.findIndex(s => s.importedGuid === incoming.importedGuid)
          : state.songs.findIndex(s => s.title === incoming.title);
        if(existingIdx >= 0){
          const cur = state.songs[existingIdx];
          const curCats = Array.isArray(cur.categories) ? cur.categories.slice() : [];
          if(folderName && !curCats.includes(folderName)) curCats.push(folderName);
          const nextCats = curCats.length > 0 ? curCats : incoming.categories;
          const nextParts = (!cur.massParts || cur.massParts.length===0) ? incoming.massParts : cur.massParts;
          if(cur.body !== incoming.body || JSON.stringify(cur.categories)!==JSON.stringify(nextCats) || JSON.stringify(cur.massParts)!==JSON.stringify(nextParts)){
            const updated = { ...cur, title: incoming.title, body: incoming.body, categories: nextCats, massParts: nextParts, importedGuid: incoming.importedGuid || cur.importedGuid };
            state.songs[existingIdx] = updated;
            await Store.saveSong(updated);
            changed = true;
          }
        } else {
          const fresh = { ...incoming, id: uid(), dateAdded: baseTime - (songs.length - i) * 10 };
          state.songs.push(fresh);
          await Store.saveSong(fresh);
          changed = true;
        }
      }
    }catch(e){}
  }
  if(changed) render();
}

// (2026-07-13) add profile avatar and dropdown component; prev: none
function profileAvatarHtml(){
  if(firebaseUser && firebaseUser.photoURL){
    return `<img src="${escapeHtml(firebaseUser.photoURL)}" class="profile-avatar" alt="Avatar"/>`;
  }
  const name = firebaseUser ? (firebaseUser.displayName || firebaseUser.email || 'Choir') : 'Guest';
  const letter = (name[0] || 'C').toUpperCase();
  return `<div class="profile-avatar">${letter}</div>`;
}
function profileDropdownHtml(){
  if(!state.profileMenuOpen) return '';
  const userName = firebaseUser ? (firebaseUser.displayName || 'Choir Director') : 'Guest User';
  const userEmail = firebaseUser ? (firebaseUser.email || (firebaseUser.isAnonymous ? 'Guest Account' : '')) : 'Local Storage Mode';
  return `
    <div class="profile-dropdown" id="profile-dropdown">
      <div class="profile-dropdown-header">
        <div style="font-weight:700;font-size:13.5px;color:var(--text);">${escapeHtml(userName)}</div>
        ${userEmail ? `<div style="font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;">${escapeHtml(userEmail)}</div>` : ''}
        <div style="font-size:10px;color:var(--accent);font-weight:700;margin-top:3px;">&#9729; Database Synced</div>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" id="menu-sort-folders">
        <span class="dropdown-icon">&#128193;</span>
        <div>
          <div style="font-weight:600;">Folder Order & Sorting</div>
          <div class="dropdown-subtext">Adjust sorting or custom reorder</div>
        </div>
      </div>
      <div class="dropdown-item" id="menu-sort-massparts">
        <span class="dropdown-icon">&#10022;</span>
        <div>
          <div style="font-weight:600;">Mass Parts Settings</div>
          <div class="dropdown-subtext">Fixed liturgical Mass order</div>
        </div>
      </div>
      <div class="dropdown-divider"></div>
      ${Store.mode==='firebase' ? `
        <div class="dropdown-item text-danger" id="menu-signout">
          <span class="dropdown-icon">&#8677;</span>
          <span style="font-weight:600;">Sign out</span>
        </div>
      ` : `
        <div class="dropdown-item" id="menu-signin">
          <span class="dropdown-icon">&#128273;</span>
          <span style="font-weight:600;">Sign in with Google</span>
        </div>
      `}
    </div>`;
}

// (2026-07-13) per-mass-part custom order & non-alphabetical gsma order; prev: alphabetical fallback
function getCodeSortRank(title){
  const t = (title || '').trim();
  const m = /^(0?\d+)\s*\|/.exec(t);
  if(!m) return { group: 3, num: 999999 };
  const raw = m[1];
  const num = parseInt(raw, 10);
  if(raw.startsWith('0')) return { group: 0, num };
  if(num >= 700) return { group: 2, num };
  return { group: 1, num };
}

function sortSongsArray(arr, massPart){
  return arr.slice().sort((a,b)=>{
    if(state.sortBy==='massflow' || !state.sortBy){
      const ordA = (massPart && a.partOrders && a.partOrders[massPart]!==undefined) ? a.partOrders[massPart] : a.sortOrder;
      const ordB = (massPart && b.partOrders && b.partOrders[massPart]!==undefined) ? b.partOrders[massPart] : b.sortOrder;
      if(ordA!==undefined && ordB!==undefined && ordA!==ordB) return ordA - ordB;
      if(ordA!==undefined && ordB===undefined) return -1;
      if(ordA===undefined && ordB!==undefined) return 1;
      const rA = getCodeSortRank(a.title);
      const rB = getCodeSortRank(b.title);
      if(rA.group !== rB.group) return rA.group - rB.group;
      if(rA.num !== rB.num) return rA.num - rB.num;
      if(a.dateAdded !== b.dateAdded) return (a.dateAdded||0) - (b.dateAdded||0);
      return 0;
    }
    if(state.sortBy==='code'){
      const rA = getCodeSortRank(a.title);
      const rB = getCodeSortRank(b.title);
      if(rA.group !== rB.group) return rA.group - rB.group;
      if(rA.num !== rB.num) return rA.num - rB.num;
      return (a.dateAdded||0) - (b.dateAdded||0);
    }
    if(state.sortBy==='title') return a.title.localeCompare(b.title);
    if(state.sortBy==='artist') return (a.artist||'').localeCompare(b.artist||'');
    if(state.sortBy==='date') return b.dateAdded - a.dateAdded;
    if(state.sortBy==='key') return (a.key||'').localeCompare(b.key||'');
    return 0;
  });
}

function getFilteredSongsForCurrentView(){
  syncLiturgicalDialogues(false);
  let songs = state.songs.slice();
  if(state.filterMassPart){
    songs = songs.filter(s=>(s.massParts||[]).includes(state.filterMassPart));
  } else if(state.filterCat==='Favorites'){
    songs = songs.filter(s=>s.favorite);
  } else if(state.filterCat!=='All'){
    const folderReg = songs.filter(s=>!(s.id && String(s.id).startsWith('lit-')) && (s.categories||[]).includes(state.filterCat));
    if(folderReg.length > 0){
      const litAll = songs.filter(s=>s.id && String(s.id).startsWith('lit-'));
      songs = folderReg.concat(litAll);
    } else {
      songs = [];
    }
  }
  if(state.search.trim()){
    const q = state.search.toLowerCase();
    songs = songs.filter(s => s.title.toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q) || (s.sectionTitle||'').toLowerCase().includes(q));
  }
  return songs;
}

function matchesAnchorPart(mpName, anchorPart){
  if(!mpName || !anchorPart) return false;
  if(mpName.toLowerCase() === anchorPart.toLowerCase()) return true;
  const cueA = findMassPartCue(mpName);
  const cueB = findMassPartCue(anchorPart);
  return !!(cueA && cueB && cueA === cueB);
}

function getOrderedSongSections(songs){
  const litMetaMap = {};
  getLiturgicalDialogueSongs().forEach((ls, idx)=>{ litMetaMap[ls.id] = { ...ls, orderIdx: idx }; });

  const litSongs = songs.filter(s=>s.id && String(s.id).startsWith('lit-')).sort((a,b)=>{
    const oa = litMetaMap[a.id] ? litMetaMap[a.id].orderIdx : 99;
    const ob = litMetaMap[b.id] ? litMetaMap[b.id].orderIdx : 99;
    return oa - ob;
  });
  const regSongs = songs.filter(s=>!(s.id && String(s.id).startsWith('lit-')));

  const placedLitIds = new Set();
  const placedRegIds = new Set();
  const sections = [];

  // (2026-07-13) lock activeParts to fixed liturgical Mass order; prev: arbitrary order
  const rawParts = (state.massParts && state.massParts.length > 0) ? state.massParts : DEFAULT_MASS_PARTS;
  const activeParts = [...new Set(rawParts)].sort((a,b)=>{
    const ia = DEFAULT_MASS_PARTS.indexOf(a);
    const ib = DEFAULT_MASS_PARTS.indexOf(b);
    if(ia >= 0 && ib >= 0) return ia - ib;
    if(ia >= 0) return -1;
    if(ib >= 0) return 1;
    return 0;
  });

  activeParts.forEach(mp=>{
    litSongs.forEach(ls=>{
      const meta = litMetaMap[ls.id] || ls;
      if(!placedLitIds.has(ls.id) && meta.anchorPos === 'before' && matchesAnchorPart(mp, meta.anchorPart)){
        placedLitIds.add(ls.id);
        sections.push({
          title: meta.sectionTitle || ls.title,
          isLiturgical: true,
          optionalLit: !!meta.optionalLit,
          litId: ls.id,
          massPart: mp,
          songs: [ls]
        });
      }
    });

    const mpReg = sortSongsArray(regSongs.filter(s=>(s.massParts||[]).includes(mp)), mp);
    if(mpReg.length > 0){
      mpReg.forEach(s=>placedRegIds.add(s.id));
      sections.push({
        title: mp,
        isLiturgical: false,
        optionalLit: false,
        massPart: mp,
        songs: mpReg
      });
    }

    litSongs.forEach(ls=>{
      const meta = litMetaMap[ls.id] || ls;
      if(!placedLitIds.has(ls.id) && meta.anchorPos === 'after' && matchesAnchorPart(mp, meta.anchorPart)){
        placedLitIds.add(ls.id);
        sections.push({
          title: meta.sectionTitle || ls.title,
          isLiturgical: true,
          optionalLit: !!meta.optionalLit,
          litId: ls.id,
          massPart: mp,
          songs: [ls]
        });
      }
    });
  });

  litSongs.forEach(ls=>{
    if(!placedLitIds.has(ls.id)){
      const meta = litMetaMap[ls.id] || ls;
      placedLitIds.add(ls.id);
      sections.push({
        title: meta.sectionTitle || ls.title,
        isLiturgical: true,
        optionalLit: !!meta.optionalLit,
        litId: ls.id,
        massPart: meta.anchorPart || null,
        songs: [ls]
      });
    }
  });

  const unplacedReg = sortSongsArray(regSongs.filter(s=>!placedRegIds.has(s.id)), 'Other');
  if(unplacedReg.length > 0){
    sections.push({
      title: 'General / Other Songs',
      isLiturgical: false,
      optionalLit: false,
      massPart: 'Other',
      songs: unplacedReg
    });
  }

  return sections;
}

// (2026-07-13) include/exclude songs per folder & skip excluded on swipe; prev: checkedSongIds
function getActiveScopeKey(){
  return state.filterMassPart ? ('mp:' + state.filterMassPart) : (state.filterCat || 'All');
}
function isSongExcluded(s, scopeKey){
  if(!s) return false;
  const key = scopeKey || getActiveScopeKey();
  return Array.isArray(s.excludedFolders) && s.excludedFolders.includes(key);
}
async function toggleSongIncludeExclude(id){
  const song = state.songs.find(s=>s.id===id);
  if(!song) return;
  if(!Array.isArray(song.excludedFolders)) song.excludedFolders = [];
  const key = getActiveScopeKey();
  const idx = song.excludedFolders.indexOf(key);
  if(idx >= 0){
    song.excludedFolders.splice(idx, 1);
  } else {
    song.excludedFolders.push(key);
  }
  await Store.saveSong(song);
  const lw = document.getElementById('list-wrap');
  if(lw){
    const prevTop = lw.scrollTop;
    lw.innerHTML = buildSongListRowsHtml();
    lw.scrollTop = prevTop;
    wireListWrapRows();
  } else {
    renderListView();
  }
}

// (2026-07-13) toggle song checkmark for batch folder assignment; prev: exclude toggle
function toggleSongChecked(id){
  const idx = state.checkedSongIds.indexOf(id);
  if(idx >= 0){
    state.checkedSongIds.splice(idx, 1);
  } else {
    state.checkedSongIds.push(id);
  }
  renderListView();
}

// (2026-07-13) default none checked in edit mode & select specific songs; prev: checked all
function renderSongRowHtml(s, secMassPart){
  const isExcluded = isSongExcluded(s);
  const isChecked = state.checkedSongIds.includes(s.id);
  const leftControl = state.listEditMode
    ? `<button class="song-check-btn ${isChecked?'checked':''}" data-check-id="${s.id}" title="${isChecked?'Deselect':'Select'}">${isChecked?iconCheckSmall():''}</button>`
    : `<span class="fav" style="display:flex;align-items:center;">${s.favorite ? iconStar(true) : iconStar(false)}</span>`;
  const rightControl = state.listEditMode
    ? `<span class="song-drag-handle" data-drag-handle="1" title="Hold and drag to reorder">${iconDragBars()}</span>`
    : '';
  const excludedBadge = isExcluded ? `<span class="excluded-badge" title="Skipped when swiping in this folder">Excluded</span>` : '';
  return `
    <div class="song-row ${state.listEditMode?'edit-mode':''} ${isChecked?'is-checked':''} ${isExcluded?'is-excluded':''}" data-id="${s.id}" data-section-mp="${escapeHtml(secMassPart||'')}">
      ${leftControl}
      <div style="flex:1;min-width:0;">
        <div class="song-title">${escapeHtml(s.title)}${excludedBadge}</div>
        <div class="song-sub">${escapeHtml(s.artist||'Unknown')} &middot; Key ${escapeHtml(transposeKeyLabel(s.key, s.transposeOffset||0)||'—')}${(s.categories&&s.categories.length)?' &middot; '+escapeHtml(s.categories.join(', ')):''}</div>
      </div>
      ${rightControl}
    </div>`;
}

// (2026-07-13) update only list-wrap on search input so input keeps focus; prev: full innerHTML
function buildSongListRowsHtml(){
  const songs = getFilteredSongsForCurrentView();
  const sections = getOrderedSongSections(songs);
  let rows = '';
  sections.forEach(sec=>{
    let secHtml = '';
    if(sec.optionalLit){
      const hidden = !!state.hideOptionalCommunionLit;
      secHtml += `
        <div class="letter-divider" style="display:flex;align-items:center;justify-content:space-between;">
          <span>&#10022; ${escapeHtml(sec.title)}</span>
          <button class="cue-toggle-btn" data-toggle-opt-lit="${escapeHtml(sec.litId)}" style="padding:1px 7px;font-size:10px;">${hidden ? 'Show Page' : 'Hide Page'}</button>
        </div>`;
      if(!hidden){
        sec.songs.forEach(s=>{ secHtml += renderSongRowHtml(s, sec.massPart); });
      }
    } else {
      secHtml += `<div class="letter-divider">${sec.isLiturgical ? '&#10022; ' : ''}${escapeHtml(sec.title)}</div>`;
      sec.songs.forEach(s=>{ secHtml += renderSongRowHtml(s, sec.massPart); });
    }
    rows += `<div class="song-section-group" data-group-mp="${escapeHtml(sec.massPart||'')}">${secHtml}</div>`;
  });
  if(songs.length===0){
    rows = `<div class="empty-state">No songs here yet.<br>Tap the + button to add one, or long-press a song to file it in this ${state.filterMassPart?'Mass Part':'folder'}.</div>`;
  }
  return rows;
}

function wireListWrapRows(){
  document.querySelectorAll('[data-toggle-opt-lit]').forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      state.hideOptionalCommunionLit = !state.hideOptionalCommunionLit;
      renderListView();
    };
  });
  document.querySelectorAll('.song-row').forEach(el=>{
    wireSongRowInteractions(el, el.dataset.id, el.dataset.sectionMp);
  });
}

function renderListView(animateChipScroll){
  const wasSearchFocused = document.activeElement && document.activeElement.id === 'search-input';
  const searchSelStart = wasSearchFocused ? document.activeElement.selectionStart : null;
  const searchSelEnd = wasSearchFocused ? document.activeElement.selectionEnd : null;
  const prevChipRow = document.querySelector('.chiprow');
  const prevChipScroll = prevChipRow ? prevChipRow.scrollLeft : 0;

  applyFolderTheme(state.filterCat);
  const rows = buildSongListRowsHtml();

  const cats = ['All', 'Favorites', ...state.categories];
  const chips = state.filterMassPart
    ? `<div class="chip active" data-back-to-folders="1">&larr; ${escapeHtml(state.filterMassPart)}</div>`
    : cats.map(c=>{
        const ct = getFolderTheme(c);
        const isActive = state.filterCat === c;
        const styleAttr = isActive
          ? `style="background:${ct.dim};border-color:${ct.accent};color:${ct.accent};"`
          : `style="border-color:${ct.dim};"`;
        return `<div class="chip ${isActive?'active':''}" data-cat="${escapeHtml(c)}" ${styleAttr}><span class="chip-dot" style="background:${ct.swatch};"></span>${escapeHtml(c)}</div>`;
      }).join('') + `<button class="chip-palette-btn ${state.showChipColorPicker?'active':''}" id="btn-chip-palette" title="Folder Color Theme">${iconPalette()}</button>`;

  const activeThemeKey = (state.folderColors && state.folderColors[state.filterCat]) || 'gold';
  const colorBarHtml = state.showChipColorPicker ? `
    <div class="chip-color-bar">
      <span class="chip-color-label">Theme for "${escapeHtml(state.filterCat)}":</span>
      <div class="chip-color-swatches">
        ${Object.values(FOLDER_THEMES).map(t=>`
          <button class="theme-swatch-btn ${activeThemeKey===t.key?'selected':''}" data-pick-folder-color="${t.key}" title="${t.label}" style="background:${t.swatch};"></button>
        `).join('')}
      </div>
    </div>` : '';

  const headerTitle = state.filterMassPart ? escapeHtml(state.filterMassPart) : (state.filterCat==='All' ? 'My Songbook' : escapeHtml(state.filterCat));
  const existingListWrap = document.getElementById('list-wrap');
  const prevListScroll = existingListWrap ? existingListWrap.scrollTop : 0;

  // (2026-07-13) add batch-folder button & default none selected in edit mode; prev: delete only
  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="btn-open-sidebar">${iconMenu()}</button>
      <h1>${headerTitle}</h1>
      <div style="display:flex;align-items:center;gap:2px;position:relative;">
        ${state.listEditMode && state.checkedSongIds.length > 0 ? `
          <button class="icon-btn" id="btn-add-checked-to-folder" title="Add Selected Songs to Folder" style="color:var(--accent);">${iconFolder()}</button>
          <button class="icon-btn" id="btn-delete-checked" title="Delete Checked Songs" style="color:var(--danger);">${iconTrash()}</button>
        ` : ''}
        <button class="icon-btn ${state.listEditMode?'active-edit':''}" id="btn-edit-list" title="${state.listEditMode?'Done Editing':'Edit & Reorder Songs'}">${state.listEditMode ? iconCheck() : iconEdit()}</button>
        <button class="icon-btn" id="btn-manage-cats" title="Folders">${iconFolder()}</button>
        <button class="profile-btn" id="btn-profile-menu" title="Profile & Settings">${profileAvatarHtml()}</button>
        ${profileDropdownHtml()}
      </div>
    </div>
    <div class="searchrow">
      <input id="search-input" placeholder="Search title or artist…" value="${escapeHtml(state.search)}"/>
      <select id="sort-select">
        <option value="massflow" ${state.sortBy==='massflow'||!state.sortBy?'selected':''}>Mass Flow / Order</option>
        <option value="code" ${state.sortBy==='code'?'selected':''}>Code / Number</option>
        <option value="title" ${state.sortBy==='title'?'selected':''}>Title</option>
        <option value="artist" ${state.sortBy==='artist'?'selected':''}>Artist</option>
        <option value="date" ${state.sortBy==='date'?'selected':''}>Recent</option>
        <option value="key" ${state.sortBy==='key'?'selected':''}>Key</option>
      </select>
    </div>
    <div class="chiprow">${chips}</div>
    ${colorBarHtml}
    <div class="list-wrap" id="list-wrap">${rows}</div>
    ${/* (2026-07-13) hide batch bar when modal open; prev: text comment in html */ ''}
    ${!state.modal && state.listEditMode && state.checkedSongIds.length > 0 ? `
      <div class="batch-action-bar" id="batch-action-bar" style="position:fixed;bottom:calc(18px + env(safe-area-inset-bottom, 0px));left:50%;transform:translateX(-50%);background:var(--bg-elev2);border:1.5px solid var(--accent);border-radius:18px;padding:8px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 36px rgba(0,0,0,0.7);z-index:15;">
        <span style="font-size:13px;font-weight:700;color:var(--accent);">${state.checkedSongIds.length} selected</span>
        <button class="btn btn-primary" id="btn-batch-add-folder" style="padding:7px 16px;min-height:36px;font-size:13px;flex:0 0 auto;">Add to Folder</button>
        <button class="btn btn-secondary" id="btn-batch-export" style="padding:7px 14px;min-height:36px;font-size:13px;flex:0 0 auto;">Export</button>
      </div>
    ` : (state.listEditMode ? '' : '<button class="fab" id="fab-add">+</button>')}
    ${sidebarHtml()}
    ${modalHtml()}
  `;

  // (2026-07-13) restore list-wrap scroll position; prev: reset to top
  const initialLw = document.getElementById('list-wrap');
  if(initialLw && prevListScroll > 0) initialLw.scrollTop = prevListScroll;

  // (2026-07-13) keep search-input focused & highlighted while typing; prev: renderListView()
  const searchInp = document.getElementById('search-input');
  if(searchInp){
    searchInp.oninput = e=>{
      state.search = e.target.value;
      const lw = document.getElementById('list-wrap');
      if(lw){
        lw.innerHTML = buildSongListRowsHtml();
        wireListWrapRows();
      }
    };
  }
  if(wasSearchFocused && searchInp){
    searchInp.focus();
    try{
      if(searchSelStart !== null) searchInp.setSelectionRange(searchSelStart, searchSelEnd);
    }catch(e){}
  }
  const sortSel = document.getElementById('sort-select');
  if(sortSel) sortSel.onchange = e=>{ state.sortBy = e.target.value; renderListView(); };
  // (2026-07-13) null check fab-add in edit mode; prev: direct onclick assignment
  const fabAdd = document.getElementById('fab-add');
  if(fabAdd) fabAdd.onclick = ()=> openEditor(null);
  const editListBtn = document.getElementById('btn-edit-list');
  if(editListBtn){
    editListBtn.onclick = ()=>{
      state.listEditMode = !state.listEditMode;
      if(!state.listEditMode) state.checkedSongIds = [];
      renderListView();
    };
  }
  const delCheckedBtn = document.getElementById('btn-delete-checked');
  if(delCheckedBtn){
    delCheckedBtn.onclick = async ()=>{
      const count = state.checkedSongIds.length;
      if(!count) return;
      if(confirm(`Delete ${count} selected song(s) from database?`)){
        const toDel = new Set(state.checkedSongIds);
        state.songs = state.songs.filter(s=>!toDel.has(s.id));
        for(const sid of toDel){
          await Store.deleteSong(sid);
        }
        state.checkedSongIds = [];
        showToast(`Deleted ${count} song(s)`);
        renderListView();
      }
    };
  }
  // (2026-07-13) wire batch add to folder modal for selected songs; prev: none
  const triggerBatchAddFolder = ()=>{
    if(!state.checkedSongIds.length) return;
    state.modal = { type: 'batch-add-folder', songIds: [...state.checkedSongIds] };
    render();
  };
  const addFolderBtn = document.getElementById('btn-add-checked-to-folder');
  if(addFolderBtn) addFolderBtn.onclick = triggerBatchAddFolder;
  const batchAddBtn = document.getElementById('btn-batch-add-folder');
  if(batchAddBtn) batchAddBtn.onclick = triggerBatchAddFolder;
  // (2026-07-13) wire batch export of selected songs; prev: none
  const batchExpBtn = document.getElementById('btn-batch-export');
  if(batchExpBtn){
    batchExpBtn.onclick = ()=>{
      const selected = state.songs.filter(s=>state.checkedSongIds.includes(s.id));
      const scope = state.filterCat && state.filterCat !== 'All' ? state.filterCat : 'Selected Songs';
      const text = generateGSMA(selected, scope);
      downloadGSMA(`${scope}.gsma`, text);
      showToast(`Exported ${selected.length} song(s) to "${scope}.gsma"`);
    };
  }
  const paletteBtn = document.getElementById('btn-chip-palette');
  if(paletteBtn){
    paletteBtn.onclick = (e)=>{
      e.stopPropagation();
      state.showChipColorPicker = !state.showChipColorPicker;
      renderListView();
    };
  }
  document.querySelectorAll('[data-pick-folder-color]').forEach(btn=>{
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const colorKey = btn.dataset.pickFolderColor;
      if(!state.folderColors) state.folderColors = {};
      state.folderColors[state.filterCat] = colorKey;
      applyFolderTheme(state.filterCat);
      await Store.saveFolderColors(state.folderColors);
      renderListView();
    };
  });
  // (2026-07-13) wire profile menu clicks and actions; prev: manage-cats only
  const profBtn = document.getElementById('btn-profile-menu');
  if(profBtn){
    profBtn.onclick = (e)=>{
      e.stopPropagation();
      state.profileMenuOpen = !state.profileMenuOpen;
      renderListView();
    };
    // (2026-07-13) close profile dropdown on document outside clicks; prev: none
    document.addEventListener('click', (e)=>{
      if(state.profileMenuOpen && !e.target.closest('#btn-profile-menu, #profile-dropdown')){
        state.profileMenuOpen = false;
        renderListView();
      }
    });
  }
  const sortFoldersMenu = document.getElementById('menu-sort-folders');
  if(sortFoldersMenu){
    sortFoldersMenu.onclick = ()=>{
      state.profileMenuOpen = false;
      state.modal = { type: 'sort-folders' };
      render();
    };
  }
  const sortMpMenu = document.getElementById('menu-sort-massparts');
  if(sortMpMenu){
    sortMpMenu.onclick = ()=>{
      state.profileMenuOpen = false;
      state.modal = { type: 'massparts' };
      render();
    };
  }
  const soMenu = document.getElementById('menu-signout');
  if(soMenu){
    soMenu.onclick = async ()=>{
      state.profileMenuOpen = false;
      await firebase.auth().signOut();
      render();
    };
  }
  const siMenu = document.getElementById('menu-signin');
  if(siMenu){
    siMenu.onclick = ()=>{
      state.profileMenuOpen = false;
      state.view = 'auth';
      render();
    };
  }
  document.getElementById('btn-manage-cats').onclick = ()=>{ state.modal = {type:'categories'}; renderListView(); };
  document.getElementById('btn-open-sidebar').onclick = ()=>{ state.sidebarOpen = true; renderListView(); };
  // (2026-07-13) scroll clicked/active chip to start of chiprow view; prev: reset scrollLeft
  document.querySelectorAll('.chip[data-cat]').forEach(el=>{
    el.onclick = ()=>{
      state.filterCat = el.dataset.cat;
      state.filterMassPart = null;
      applyFolderTheme(state.filterCat);
      renderListView(true);
    };
  });
  const newChipRow = document.querySelector('.chiprow');
  if(newChipRow){
    newChipRow.scrollLeft = prevChipScroll;
    const activeChip = newChipRow.querySelector('.chip.active');
    if(activeChip){
      const targetLeft = Math.max(0, activeChip.offsetLeft - 12);
      if(animateChipScroll){
        requestAnimationFrame(()=>{
          newChipRow.scrollTo({ left: targetLeft, behavior: 'smooth' });
        });
      } else {
        newChipRow.scrollLeft = targetLeft;
      }
    }
  }
  const backChip = document.querySelector('[data-back-to-folders]');
  if(backChip) backChip.onclick = ()=>{ state.filterMassPart = null; state.filterCat = 'All'; applyFolderTheme('All'); renderListView(); };

  wireListWrapRows();
  wireSidebar();
  wireModal();
}

// (2026-07-13) wire edit mode checkmarks & 3-line hold-drag auto-scroll reorder; prev: fav only
function wireSongRowInteractions(el, id, sectionMassPart){
  let pressTimer = null, moved = false, longFired = false;

  const checkBtn = el.querySelector('.song-check-btn');
  if(checkBtn){
    const toggleCheck = (e)=>{
      e.stopPropagation();
      e.preventDefault();
      // (2026-07-13) toggle song checkmark for batch folder selection; prev: exclude
      toggleSongChecked(id);
    };
    checkBtn.addEventListener('click', toggleCheck);
  }

  const dragHandle = el.querySelector('[data-drag-handle]');
  if(dragHandle){
    const startDrag = (startEvent)=>{
      startEvent.stopPropagation();
      if(startEvent.cancelable) startEvent.preventDefault();
      const listWrap = document.getElementById('list-wrap');
      const sectionGroup = el.closest('.song-section-group') || listWrap;
      if(!listWrap || !sectionGroup) return;

      el.classList.add('is-dragging');
      if(navigator.vibrate) navigator.vibrate(12);

      let currentY = (startEvent.touches && startEvent.touches[0]) ? startEvent.touches[0].clientY : startEvent.clientY;
      let autoScrollRaf = null;
      let dragging = true;

      const updateDomOrder = (clientY)=>{
        const siblings = Array.from(sectionGroup.querySelectorAll('.song-row'));
        for(const sib of siblings){
          if(sib === el) continue;
          const r = sib.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          if(clientY < mid){
            sectionGroup.insertBefore(el, sib);
            return;
          }
        }
        sectionGroup.appendChild(el);
      };

      const autoScrollTick = ()=>{
        if(!dragging) return;
        const wrapRect = listWrap.getBoundingClientRect();
        const edgeZone = 68;
        if(currentY < wrapRect.top + edgeZone){
          const delta = Math.max(2, Math.round((wrapRect.top + edgeZone - currentY) * 0.22));
          listWrap.scrollTop -= delta;
          updateDomOrder(currentY);
        } else if(currentY > wrapRect.bottom - edgeZone){
          const delta = Math.max(2, Math.round((currentY - (wrapRect.bottom - edgeZone)) * 0.22));
          listWrap.scrollTop += delta;
          updateDomOrder(currentY);
        }
        autoScrollRaf = requestAnimationFrame(autoScrollTick);
      };
      autoScrollRaf = requestAnimationFrame(autoScrollTick);

      const onMove = (moveEvent)=>{
        if(!dragging) return;
        if(moveEvent.cancelable) moveEvent.preventDefault();
        currentY = (moveEvent.touches && moveEvent.touches[0]) ? moveEvent.touches[0].clientY : moveEvent.clientY;
        updateDomOrder(currentY);
      };

      const onEnd = async ()=>{
        if(!dragging) return;
        dragging = false;
        if(autoScrollRaf) cancelAnimationFrame(autoScrollRaf);
        el.classList.remove('is-dragging');
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);

        const orderedRows = Array.from(sectionGroup.querySelectorAll('.song-row'));
        const mpKey = sectionMassPart || sectionGroup.dataset.groupMp || '';
        state.sortBy = 'massflow';
        const toSave = [];
        orderedRows.forEach((rowEl, idx)=>{
          const sid = rowEl.dataset.id;
          const song = state.songs.find(s=>s.id===sid);
          if(song){
            if(!song.partOrders) song.partOrders = {};
            if(mpKey) song.partOrders[mpKey] = idx + 1;
            song.sortOrder = idx + 1;
            toSave.push(song);
          }
        });
        for(const s of toSave){
          try{ await Store.saveSong(s); }catch(e){}
        }
      };

      window.addEventListener('touchmove', onMove, {passive:false});
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
    };

    dragHandle.addEventListener('touchstart', startDrag, {passive:false});
    dragHandle.addEventListener('mousedown', startDrag);
  }

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
    if(e.target.closest('.fav, .song-check-btn, .song-drag-handle')) return;
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
    if(e.target.closest('.fav, .song-check-btn, .song-drag-handle')) return;
    cancel();
    if(!moved && !longFired){
      if(state.listEditMode){
        // (2026-07-13) tap row to toggle batch selection in edit mode; prev: exclude
        toggleSongChecked(id);
      } else {
        openViewer(id, null, sectionMassPart);
      }
    }
  });
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', (e)=>{
    if(e.target.closest('.fav, .song-check-btn, .song-drag-handle')) return;
    cancel();
    if(!longFired){
      if(state.listEditMode){
        toggleSongChecked(id);
      } else {
        openViewer(id, null, sectionMassPart);
      }
    }
  });
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('contextmenu', e=>e.preventDefault());
}

// (2026-07-13) arm 7s autoscroll on song open; prev: stopped before render
function openViewer(id, fromSetlistId, preferredMassPart){
  state.currentId = id;
  state.cameFromSetlistId = fromSetlistId || null;
  if(preferredMassPart) state.selectedViewerMassPart = preferredMassPart;
  state.view = 'viewer';
  stopMetronome();
  autoscrollFloatPos = 0;
  lastUserScrollAt = 0;
  const song = state.songs.find(s=>s.id===id);
  startAutoscroll(song, false);
  render();
}
function currentSong(){ return state.songs.find(s=>s.id===state.currentId); }

// (2026-07-13) skip excluded songs when swiping/navigating viewer order; prev: included all
function getViewerSongList(){
  if(state.cameFromSetlistId){
    const sl = state.setlists.find(s=>s.id===state.cameFromSetlistId);
    if(sl && Array.isArray(sl.items)){
      const ids = sl.items.filter(it=>it.type==='song'&&it.songId).map(it=>it.songId);
      const res = ids.map(id=>state.songs.find(s=>s.id===id)).filter(Boolean);
      if(res.length > 0) return res;
    }
  }
  const songs = getFilteredSongsForCurrentView();
  const sections = getOrderedSongSections(songs);
  const ordered = [];
  const seen = new Set();
  sections.forEach(sec=>{
    if(sec.optionalLit && state.hideOptionalCommunionLit) return;
    sec.songs.forEach(s=>{
      if(isSongExcluded(s) && s.id !== state.currentId) return;
      if(!seen.has(s.id)){
        seen.add(s.id);
        ordered.push(s);
      }
    });
  });
  return ordered;
}

// (2026-07-13) interactive piano pitch finder & auto-transposing cue chords; prev: static chords
function getCueKeyIdx(){
  return typeof state.cueKeyIdx === 'number' ? state.cueKeyIdx : 2;
}
function getCueNoteMode(){
  return state.cueNoteMode === '1st' ? '1st' : '2nd';
}
function getCueSemis(){
  return (getCueKeyIdx() - 2 + 12) % 12;
}
function renderCuePianoFinder(){
  const mode = getCueNoteMode();
  const keyIdx = getCueKeyIdx();
  const activeNoteIdx = mode === '1st' ? (keyIdx + 4) % 12 : keyIdx;
  // (2026-07-13) spell cue key with sharps instead of flats; prev: preferFlat
  const keyName = spellNote(keyIdx, false);
  const whiteNotes = [
    { idx: 0, label: 'C' },
    { idx: 2, label: 'D' },
    { idx: 4, label: 'E' },
    { idx: 5, label: 'F' },
    { idx: 7, label: 'G' },
    { idx: 9, label: 'A' },
    { idx: 11, label: 'B' }
  ];
  const blackNotes = [
    { idx: 1, label: 'C#', left: '10.4%' },
    { idx: 3, label: 'D#', left: '24.7%' },
    { idx: 6, label: 'F#', left: '53.3%' },
    { idx: 8, label: 'G#', left: '67.6%' },
    { idx: 10, label: 'A#', left: '81.9%' }
  ];
  return `
    <div class="cue-piano-wrap">
      <div class="cue-piano-toolbar">
        <div class="cue-piano-mode-wrap">
          <span class="cue-piano-label">Find Priest Key:</span>
          <select class="cue-note-mode-select" title="Select which note the priest is chanting">
            <option value="2nd" ${mode==='2nd'?'selected':''}>2nd Note</option>
            <option value="1st" ${mode==='1st'?'selected':''}>1st Note</option>
          </select>
        </div>
        <div class="cue-piano-key-badge">Key: <b class="cue-key-readout">${escapeHtml(keyName)}</b></div>
      </div>
      <div class="cue-piano-keyboard">
        ${whiteNotes.map(n=>`<button type="button" class="cue-piano-key white-key ${activeNoteIdx===n.idx?'is-active':''}" data-piano-note="${n.idx}"><span>${n.label}</span></button>`).join('')}
        ${blackNotes.map(n=>`<button type="button" class="cue-piano-key black-key ${activeNoteIdx===n.idx?'is-active':''}" data-piano-note="${n.idx}" style="left:${n.left};"><span>${n.label}</span></button>`).join('')}
      </div>
    </div>`;
}

function renderCueChordPills(chordStr, cueId){
  const raw = getCueChordText(cueId, chordStr);
  if(state.editingCueChords && (chordStr || raw)){
    return `<div class="cue-chord-row is-editing"><input type="text" class="cue-chord-input" data-cue-id="${escapeHtml(cueId||'')}" value="${escapeHtml(raw)}" spellcheck="false" autocomplete="off"/></div>`;
  }
  if(!raw) return '';
  const transposed = transposeSpacedChordLine(raw, getCueSemis());
  return `<div class="cue-chord-row" data-base-chords="${escapeHtml(raw)}">${renderChordLine('>' + transposed)}</div>`;
}

function renderMassPartCueCard(song){
  if(song.id && String(song.id).startsWith('lit-')) return '';
  const parts = song.massParts || [];
  if(!parts || parts.length === 0) return '';
  const currentPart = (state.selectedViewerMassPart && parts.includes(state.selectedViewerMassPart))
    ? state.selectedViewerMassPart
    : parts[0];
  const cue = findMassPartCue(currentPart);
  if(!cue) return '';

  const selectorHtml = parts.length > 1 ? `
    <select id="viewer-masspart-select" class="viewer-masspart-select" title="Switch Mass Part Cue">
      ${parts.map(p=>`<option value="${escapeHtml(p)}" ${p===currentPart?'selected':''}>${escapeHtml(p)}</option>`).join('')}
    </select>
  ` : `<span class="masspart-cue-badge">${escapeHtml(currentPart)}</span>`;

  // (2026-07-13) pin cue toggle top-right with svg icons & remove cue-sing; prev: wrapped
  if(state.hideCueCard){
    return `
      <div class="masspart-cue-card collapsed" id="masspart-cue-card">
        <div class="masspart-cue-header">
          <div class="masspart-cue-title">
            <span class="masspart-cue-star">&#10022;</span>
            <span class="masspart-cue-title-text">${escapeHtml(cue.title)}</span>
          </div>
          <div class="masspart-cue-actions">
            ${selectorHtml}
            <button class="cue-toggle-btn" id="btn-toggle-cue" title="Show Liturgical Cues">${iconCueShow()}<span>Show</span></button>
          </div>
        </div>
      </div>`;
  }

  const hasAnyChords = (cue.cues||[]).some(c=>!!c.chords) || !!(cue.postPrayer && cue.postPrayer.chords);
  const editCueBtnHtml = hasAnyChords
    ? `<button class="cue-toggle-btn ${state.editingCueChords?'is-active':''}" id="btn-edit-cue" title="Adjust chord spacing">${state.editingCueChords ? 'Done' : 'Spacing'}</button>`
    : '';

  // (2026-07-13) group priest, syllable-spaced chords, and response; prev: unspaced chords
  const cueItemsHtml = (cue.cues||[]).map((c, idx)=>{
    const cid = c.id || `${currentPart.toLowerCase()}-${idx}`;
    return `
    <div class="cue-item">
      <div class="cue-line cue-priest"><span class="dialogue-badge priest-badge">${iconPriestCross()} Priest</span><span class="cue-text">${escapeHtml(c.priest)}</span></div>
      ${c.response ? `
        <div class="cue-response-group">
          ${renderCueChordPills(c.chords, cid)}
          <div class="cue-line cue-response"><span class="dialogue-badge response-badge">${iconPeopleGroup()} Response</span><span class="cue-text">${escapeHtml(c.response)}</span></div>
        </div>
      ` : renderCueChordPills(c.chords, cid)}
    </div>`;
  }).join('');

  let postSongHtml = '';
  if(cue.postPrayer){
    const postCid = cue.postPrayer.id || `${currentPart.toLowerCase()}-post`;
    postSongHtml += `
      <div class="cue-item cue-sub-section">
        <div class="cue-sub-title">After Song &bull; Collect Prayer</div>
        <div class="cue-line cue-priest"><span class="dialogue-badge priest-badge">${iconPriestCross()} Priest</span><span class="cue-text">${escapeHtml(cue.postPrayer.priest)}</span></div>
        <div class="cue-response-group">
          ${renderCueChordPills(cue.postPrayer.chords, postCid)}
          <div class="cue-line cue-response"><span class="dialogue-badge response-badge">${iconPeopleGroup()} Response</span><span class="cue-text">${escapeHtml(cue.postPrayer.response)}</span></div>
        </div>
      </div>`;
  }

  if(cue.communionInvite){
    postSongHtml += `
      <div class="cue-item cue-sub-section">
        <div class="cue-sub-title">After Lamb of God &bull; Invitation to Communion</div>
        <div class="cue-line cue-priest"><span class="dialogue-badge priest-badge">${iconPriestCross()} Priest</span><span class="cue-text">${escapeHtml(cue.communionInvite.priest)}</span></div>
        <div class="cue-line cue-response"><span class="dialogue-badge response-badge">${iconPeopleGroup()} Response</span><span class="cue-text">${escapeHtml(cue.communionInvite.response)}</span></div>
      </div>`;
  }

  // (2026-07-13) place find priest key at bottom of cue card; prev: under header
  return `
    <div class="masspart-cue-card" id="masspart-cue-card">
      <div class="masspart-cue-header">
        <div class="masspart-cue-title">
          <span class="masspart-cue-star">&#10022;</span>
          <span class="masspart-cue-title-text">${escapeHtml(cue.title)}</span>
        </div>
        <div class="masspart-cue-actions">
          ${selectorHtml}
          ${editCueBtnHtml}
          <button class="cue-toggle-btn" id="btn-toggle-cue" title="Hide Liturgical Cues">${iconCueHide()}<span>Hide</span></button>
        </div>
      </div>
      <div class="masspart-cue-body">
        ${cueItemsHtml}
        ${postSongHtml}
      </div>
      ${renderCuePianoFinder()}
    </div>`;
}

function renderMassPartFooterCue(song){
  if(song.id && String(song.id).startsWith('lit-')) return '';
  const parts = song.massParts || [];
  if(!parts || parts.length === 0) return '';
  const currentPart = (state.selectedViewerMassPart && parts.includes(state.selectedViewerMassPart))
    ? state.selectedViewerMassPart
    : parts[0];
  const cue = findMassPartCue(currentPart);
  if(!cue || !cue.doxology) return '';

  if(state.hideDoxology){
    return `
      <div class="masspart-cue-card collapsed" style="margin:20px -16px 8px -16px;border-top:1px solid var(--line);">
        <div class="masspart-cue-header">
          <div class="masspart-cue-title">
            <span class="masspart-cue-star">&#10022;</span>
            <span class="masspart-cue-title-text">Doxology Cue (Human sa Amahan Namo)</span>
          </div>
          <div class="masspart-cue-actions">
            <button class="cue-toggle-btn" id="btn-toggle-doxology" title="Show Doxology Cue">${iconCueShow()}<span>Show</span></button>
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="masspart-cue-card" style="margin:20px -16px 8px -16px;border-top:1px solid var(--line);">
      <div class="masspart-cue-header">
        <div class="masspart-cue-title">
          <span class="masspart-cue-star">&#10022;</span>
          <span class="masspart-cue-title-text">Doxology Cue (Human sa Amahan Namo)</span>
        </div>
        <div class="masspart-cue-actions">
          <button class="cue-toggle-btn" id="btn-toggle-doxology" title="Hide Doxology Cue">${iconCueHide()}<span>Hide</span></button>
        </div>
      </div>
      ${renderCuePianoFinder()}
      <div class="masspart-cue-body">
        <div class="cue-item">
          <div class="cue-line cue-priest"><span class="dialogue-badge priest-badge">${iconPriestCross()} Priest</span><span class="cue-text">${escapeHtml(cue.doxology.priest)}</span></div>
        </div>
      </div>
    </div>`;
}

function renderViewer(){
  const song = currentSong();
  if(!song){ state.view='list'; return renderListView(); }
  const existingChartWrap = document.getElementById('chart-wrap');
  const prevScrollTop = existingChartWrap ? existingChartWrap.scrollTop : 0;
  const offset = song.transposeOffset||0;
  const preferFlat = FLAT_KEYS.has(transposeKeyLabel(song.key, offset));
  const body = offset ? transposeBody(song.body, offset, preferFlat) : song.body;
  const fontSize = song.viewerFontSize || 15;
  const scrollSpeed = song.viewerScrollSpeed || 30;
  const isActivelyScrolling = state.autoscroll && performance.now() >= autoscrollTopDelayUntil;

  // (2026-07-13) render melody G-clef staff & dialogue badges; prev: plain divs
  const lines = body.split('\n').map(line=>{
    const cls = classifyLine(line);
    if(cls==='melody') return renderMelodyStaffLine(line);
    if(cls==='chord') return `<div class="lyric-line">${renderChordLine(line)}</div>`;
    if(cls==='bracket') return `<div class="lyric-line">${renderBracketLine(line)}</div>`;
    if(cls==='divider') return `<hr class="chart-hr"/>`;
    if(cls==='section') return `<div class="section-line">${escapeHtml(line)}</div>`;
    if(cls==='priest') return renderPriestLine(line);
    if(cls==='response') return renderResponseLine(line);
    if(cls==='blank') return `<div>&nbsp;</div>`;
    return `<div class="lyric-line">${escapeHtml(line)}</div>`;
  }).join('');

  const beatsPerBar = parseInt((song.timeSig||'4/4').split('/')[0]) || 4;
  let beatDots = '';
  for(let i=0;i<beatsPerBar;i++) beatDots += `<span class="beat-dot" data-beat="${i}"></span>`;

  const songList = getViewerSongList();
  const currentIndex = songList.findIndex(s=>s.id===song.id);
  const prevSong = currentIndex > 0 ? songList[currentIndex - 1] : null;
  const nextSong = currentIndex >= 0 && currentIndex < songList.length - 1 ? songList[currentIndex + 1] : null;

  // (2026-07-13) add topbar navigation and liturgical cue card; prev: basic topbar
  app.innerHTML = `
    <div class="topbar" id="viewer-topbar">
      <button class="icon-btn" id="btn-back">${iconBack()}</button>
      <button class="icon-btn" id="btn-prev-song" ${prevSong?'':'disabled'} title="${prevSong?escapeHtml(prevSong.title):'No previous song'}">${iconChevronLeft()}</button>
      <h1 style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:700;">${escapeHtml(song.title)}</h1>
      <button class="icon-btn" id="btn-next-song" ${nextSong?'':'disabled'} title="${nextSong?escapeHtml(nextSong.title):'No next song'}">${iconChevronRight()}</button>
      <button class="icon-btn" id="btn-speed-toggle" title="Speed Controls">${iconSpeedArrows()}</button>
      <button class="icon-btn playbar-play" id="btn-playpause" title="Play/Pause">${isActivelyScrolling ? iconPause() : iconPlay()}</button>
      <button class="icon-btn playbar-restart" id="btn-restart" title="Restart">${iconRestart()}</button>
      <button class="icon-btn" id="btn-adjust" title="Menu">${iconDots()}</button>
    </div>
    <div class="viewer-body">
      <div class="chart-wrap" id="chart-wrap" style="font-size:${fontSize}px">
        ${renderMassPartCueCard(song)}
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
        ${renderMassPartFooterCue(song)}
      </div>
      <div class="scroll-overlay" id="scroll-overlay">
        <button class="scroll-square up" id="tri-up">${iconBigTriangleUp()}<span class="scroll-square-label">Faster</span></button>
        <button class="scroll-square down" id="tri-down">${iconBigTriangleDown()}<span class="scroll-square-label">Slower</span></button>
      </div>
      <div class="speed-slider-wrap hidden" id="speed-slider-wrap">
        <span class="speed-slider-icon">${iconSpeedArrows()}</span>
        <input type="range" id="speed-range-slider" min="5" max="100" value="${scrollSpeed}">
      </div>
    </div>
    ${modalHtml()}
  `;

  const chartWrap = document.getElementById('chart-wrap');
  const chartBody = document.getElementById('chart-body');
  if(chartWrap && prevScrollTop > 0){
    chartWrap.scrollTop = prevScrollTop;
  }

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
  // (2026-07-13) wire prev/next songs, touch swiping, and liturgical cue toggles
  const prevBtn = document.getElementById('btn-prev-song');
  if(prevBtn && prevSong){
    prevBtn.onclick = ()=> openViewer(prevSong.id, state.cameFromSetlistId);
  }
  const nextBtn = document.getElementById('btn-next-song');
  if(nextBtn && nextSong){
    nextBtn.onclick = ()=> openViewer(nextSong.id, state.cameFromSetlistId);
  }
  const mpSelect = document.getElementById('viewer-masspart-select');
  if(mpSelect){
    mpSelect.onchange = (e)=>{
      state.selectedViewerMassPart = e.target.value;
      renderViewer();
    };
  }
  const toggleCueBtn = document.getElementById('btn-toggle-cue');
  if(toggleCueBtn){
    toggleCueBtn.onclick = ()=>{
      state.hideCueCard = !state.hideCueCard;
      renderViewer();
    };
  }
  const editCueBtn = document.getElementById('btn-edit-cue');
  if(editCueBtn){
    editCueBtn.onclick = ()=>{
      state.editingCueChords = !state.editingCueChords;
      renderViewer();
    };
  }
  document.querySelectorAll('.cue-chord-input').forEach(inp=>{
    inp.oninput = (e)=>{
      saveCueChordText(inp.dataset.cueId, e.target.value);
    };
  });
  // (2026-07-13) wire cue piano keys & 1st/2nd note mode to transpose cue chords; prev: none
  const syncCuePianoDom = ()=>{
    const mode = getCueNoteMode();
    const keyIdx = getCueKeyIdx();
    const activeNoteIdx = mode === '1st' ? (keyIdx + 4) % 12 : keyIdx;
    // (2026-07-13) spell cue key and chords with sharps; prev: preferFlat
    const keyName = spellNote(keyIdx, false);
    const semis = getCueSemis();
    document.querySelectorAll('.cue-note-mode-select').forEach(sel=>{ sel.value = mode; });
    document.querySelectorAll('.cue-key-readout').forEach(el=>{ el.textContent = keyName; });
    document.querySelectorAll('.cue-piano-key').forEach(btn=>{
      btn.classList.toggle('is-active', parseInt(btn.dataset.pianoNote, 10) === activeNoteIdx);
    });
    document.querySelectorAll('.cue-chord-row[data-base-chords]').forEach(row=>{
      const base = row.getAttribute('data-base-chords') || '';
      const transposed = transposeSpacedChordLine(base, semis, false);
      row.innerHTML = renderChordLine('>' + transposed);
      row.querySelectorAll('.chord-tok').forEach(el=>{
        el.onclick = ()=>{ state.modal = {type:'chord', chord: el.dataset.chord}; renderViewer(); };
      });
    });
  };
  document.querySelectorAll('.cue-note-mode-select').forEach(sel=>{
    sel.onchange = (e)=>{
      state.cueNoteMode = e.target.value === '1st' ? '1st' : '2nd';
      syncCuePianoDom();
    };
  });
  document.querySelectorAll('.cue-piano-key').forEach(btn=>{
    let touched = false;
    const triggerKey = (e)=>{
      if(e && e.stopPropagation) e.stopPropagation();
      const noteIdx = parseInt(btn.dataset.pianoNote, 10);
      if(isNaN(noteIdx)) return;
      playPianoNote(noteIdx);
      const mode = getCueNoteMode();
      state.cueKeyIdx = mode === '1st' ? (noteIdx - 4 + 12) % 12 : noteIdx;
      syncCuePianoDom();
    };
    btn.addEventListener('touchstart', (e)=>{
      touched = true;
      e.stopPropagation();
      if(e.cancelable) e.preventDefault();
      triggerKey(e);
    }, {passive:false});
    btn.addEventListener('touchend', (e)=>{
      e.stopPropagation();
      if(e.cancelable) e.preventDefault();
    }, {passive:false});
    btn.addEventListener('touchmove', (e)=>{
      e.stopPropagation();
    }, {passive:false});
    btn.addEventListener('mousedown', (e)=>{
      e.stopPropagation();
      if(touched){ touched = false; return; }
      triggerKey(e);
    });
  });
  const toggleDoxBtn = document.getElementById('btn-toggle-doxology');
  if(toggleDoxBtn){
    toggleDoxBtn.onclick = ()=>{
      state.hideDoxology = !state.hideDoxology;
      renderViewer();
    };
  }
  // (2026-07-13) block song swipe on piano & cue card touches; prev: accidental swipe
  const viewerBodyEl = document.querySelector('.viewer-body');
  if(viewerBodyEl){
    let startX = 0, startY = 0, startTime = 0;
    viewerBodyEl.addEventListener('touchstart', (e)=>{
      if(e.target.closest('#masspart-cue-card, .cue-piano-wrap, .cue-piano-key, .speed-slider-wrap, .scroll-square, button, select, input, textarea, a, .melody-staff-section')){
        startX = 0; startY = 0; startTime = 0;
        return;
      }
      if(e.touches && e.touches.length === 1){
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, {passive:true});
    viewerBodyEl.addEventListener('touchend', (e)=>{
      if(!startTime || !startX || (Date.now() - startTime > 700)){
        startX = 0; startY = 0; startTime = 0;
        return;
      }
      if(e.target.closest('#masspart-cue-card, .cue-piano-wrap, .cue-piano-key, .speed-slider-wrap, .scroll-square, button, select, input, textarea, a, .melody-staff-section')){
        startX = 0; startY = 0; startTime = 0;
        return;
      }
      if(e.changedTouches && e.changedTouches.length === 1){
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if(Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5){
          if(dx < 0 && nextSong){
            openViewer(nextSong.id, state.cameFromSetlistId);
          } else if(dx > 0 && prevSong){
            openViewer(prevSong.id, state.cameFromSetlistId);
          }
        }
      }
      startX = 0; startY = 0; startTime = 0;
    }, {passive:true});
  }
  document.onkeydown = (e)=>{
    if(state.view==='viewer' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
      if(e.key==='ArrowLeft' && prevSong) openViewer(prevSong.id, state.cameFromSetlistId);
      if(e.key==='ArrowRight' && nextSong) openViewer(nextSong.id, state.cameFromSetlistId);
    }
  };
  document.getElementById('btn-adjust').onclick = ()=>{ state.modal = {type:'adjust', id:song.id}; renderViewer(); };
  // (2026-07-13) 7s delay at top on restart; prev: 5000ms
  document.getElementById('btn-restart').onclick = ()=>{
    chartWrap.scrollTo({top:0, behavior:'smooth'});
    autoscrollFloatPos = 0;
    lastUserScrollAt = 0;
    startAutoscroll(song, false);
    const pb = document.getElementById('btn-playpause');
    if(pb) pb.innerHTML = iconPlay();
  };
  // (2026-07-13) play button starts slow scroll instantly, pause stops; prev: toggled state only
  const playBtn = document.getElementById('btn-playpause');
  if(playBtn){
    playBtn.onclick = ()=>{
      const waitingDelay = state.autoscroll && performance.now() < autoscrollTopDelayUntil;
      if(state.autoscroll && !waitingDelay){
        stopAutoscroll();
        playBtn.innerHTML = iconPlay();
      } else {
        startAutoscroll(song, true);
        playBtn.innerHTML = iconPause();
      }
    };
  }
  
  // (2026-07-13) show speed slider with 2s fade on toggle/drag; prev: permanent show
  const speedToggleBtn = document.getElementById('btn-speed-toggle');
  if(speedToggleBtn){
    speedToggleBtn.onclick = ()=>{
      showSpeedSliderTemporarily(2000);
    };
  }

  const speedSlider = document.getElementById('speed-range-slider');
  if(speedSlider){
    speedSlider.oninput = async (e)=>{
      showSpeedSliderTemporarily(2000);
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
  document.querySelectorAll('[data-staff-note]').forEach(el=>{
    el.onclick = ()=>{
      const semi = parseInt(el.dataset.staffNote, 10);
      if(!isNaN(semi)) playPianoNote(semi);
    };
  });
  wireModal();

  /* Big transparent square buttons on the right: hold/tap continuous speed adjustment */
  wireSpeedSquare(document.getElementById('tri-up'), song, +1);
  wireSpeedSquare(document.getElementById('tri-down'), song, -1);

  /* Pinch-to-zoom directly on chart-wrap: reflows text incrementally and saves per-song. */
  wirePinchZoom(chartWrap, chartBody, song);

  // (2026-07-13) only mark manual scroll on drag/wheel so taps dont reset 7s delay; prev: touchstart
  const markUserScroll = ()=>{ lastUserScrollAt = performance.now(); };
  chartWrap.addEventListener('touchmove', markUserScroll, {passive:true});
  chartWrap.addEventListener('wheel', markUserScroll, {passive:true});
  chartWrap.addEventListener('scroll', ()=>{
    if(!state.autoscroll) return;
    if(Math.abs(chartWrap.scrollTop - Math.floor(autoscrollFloatPos)) > 18){
      lastUserScrollAt = performance.now();
    }
  }, {passive:true});

  if(state.autoscroll && !autoscrollRAF){
    startAutoscroll(song, performance.now() >= autoscrollTopDelayUntil);
  }
}

/* ---------------- AUTOSCROLL (smooth, rAF-based) ---------------- */
// (2026-07-13) 7s delay on open & instant slow scroll on play; prev: reset on touchstart
let autoscrollRAF = null, autoscrollLastTs = null, autoscrollFloatPos = 0, lastUserScrollAt = 0, autoscrollTopDelayUntil = 0;
function pxPerSecondFromSpeed(speed){
  return 3 + (speed/100)*35;
}
function startAutoscroll(song, immediate){
  state.autoscroll = true;
  if(autoscrollRAF){
    cancelAnimationFrame(autoscrollRAF);
    autoscrollRAF = null;
  }
  autoscrollLastTs = null;
  const el = document.getElementById('chart-wrap');
  if(el){
    autoscrollFloatPos = el.scrollTop;
  }
  if(immediate){
    autoscrollTopDelayUntil = 0;
    lastUserScrollAt = 0;
  } else {
    autoscrollTopDelayUntil = performance.now() + 7000;
  }
  let iconSynced = !!immediate;
  const step = (ts)=>{
    if(!state.autoscroll){
      autoscrollRAF = null;
      return;
    }
    const chart = document.getElementById('chart-wrap');
    if(chart){
      if(Math.abs(chart.scrollTop - autoscrollFloatPos) > 25){
        autoscrollFloatPos = chart.scrollTop;
      }
      if(autoscrollLastTs != null){
        const dt = Math.min((ts - autoscrollLastTs) / 1000, 0.05);
        const activeSong = currentSong() || song;
        const speed = (activeSong && activeSong.viewerScrollSpeed) ? activeSong.viewerScrollSpeed : 30;
        const now = performance.now();
        if(now < autoscrollTopDelayUntil){
          autoscrollFloatPos = chart.scrollTop;
        } else if(now - lastUserScrollAt < 600){
          autoscrollFloatPos = chart.scrollTop;
        } else {
          if(!iconSynced){
            iconSynced = true;
            const pb = document.getElementById('btn-playpause');
            if(pb) pb.innerHTML = iconPause();
          }
          const maxScroll = chart.scrollHeight - chart.clientHeight;
          if(maxScroll > 0 && autoscrollFloatPos < maxScroll){
            autoscrollFloatPos = Math.min(maxScroll, autoscrollFloatPos + pxPerSecondFromSpeed(speed) * dt);
            chart.scrollTop = Math.round(autoscrollFloatPos);
          }
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
  autoscrollTopDelayUntil = 0;
  if(autoscrollRAF){
    cancelAnimationFrame(autoscrollRAF);
    autoscrollRAF = null;
  }
}

// (2026-07-13) show speed slider on scroll-square hold & fade after 2s; prev: always shown
let speedSliderFadeTimer = null;
function showSpeedSliderTemporarily(ms){
  const sliderWrap = document.getElementById('speed-slider-wrap');
  if(!sliderWrap) return;
  clearTimeout(speedSliderFadeTimer);
  sliderWrap.classList.remove('hidden');
  if(ms > 0){
    speedSliderFadeTimer = setTimeout(()=>{
      const sw = document.getElementById('speed-slider-wrap');
      if(sw) sw.classList.add('hidden');
    }, ms);
  }
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
    showSpeedSliderTemporarily(0);
    updateSpeed(direction * 3);
    clearInterval(intervalId);
    intervalId = setInterval(()=>{
      updateSpeed(direction * 2);
    }, 120);
  };
  const endHold = ()=>{
    if(el.classList.contains('is-pressed')){
      showSpeedSliderTemporarily(2000);
    }
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
          ${state.categories.map(c=>{
            const ct = getFolderTheme(c);
            const isSel = (d.categories||[]).includes(c);
            const st = isSel ? `background:${ct.dim};border-color:${ct.accent};color:${ct.accent};` : `border-color:${ct.dim};`;
            return `<div class="cat-toggle ${isSel?'selected':''}" data-cat="${escapeHtml(c)}" style="${st}"><span class="chip-dot" style="background:${ct.swatch};margin-right:6px;"></span>${escapeHtml(c)}</div>`;
          }).join('')}
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
  // (2026-07-13) apply folder theme colors to editor folder chips; prev: default accent
  document.querySelectorAll('.cat-toggle[data-cat]').forEach(el=>{
    el.onclick = ()=>{
      const c = el.dataset.cat;
      const ct = getFolderTheme(c);
      d.categories = d.categories || [];
      const idx = d.categories.indexOf(c);
      const nowSel = idx < 0;
      if(idx>=0) d.categories.splice(idx,1); else d.categories.push(c);
      el.classList.toggle('selected', nowSel);
      el.style.background = nowSel ? ct.dim : '';
      el.style.borderColor = nowSel ? ct.accent : ct.dim;
      el.style.color = nowSel ? ct.accent : '';
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


// (2026-07-13) left-align sidebar top labels & keep folder rows clean; prev: space-between
function sidebarHtml(){
  const folderItems = state.categories.map(c=>{
    const count = state.songs.filter(s=>(s.categories||[]).includes(c)).length;
    const ct = getFolderTheme(c);
    return `
      <div class="side-item folder-item-row" data-goto-folder="${escapeHtml(c)}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 8px;">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;overflow:hidden;">
          <span style="display:inline-flex;align-items:center;width:15px;height:15px;color:${ct.swatch};opacity:0.9;" title="Saved in database">${iconFolder()}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex:0 0 auto;">
          <span class="side-count">${count}</span>
          <button class="icon-btn folder-act-btn" data-rename-folder="${escapeHtml(c)}" title="Edit folder name, color & songs" style="width:24px;height:24px;padding:3px;opacity:0.7;">${iconEdit()}</button>
          <button class="icon-btn folder-act-btn" data-del-folder="${escapeHtml(c)}" title="Delete folder from database" style="width:24px;height:24px;padding:3px;opacity:0.7;color:var(--danger);">${iconTrash()}</button>
        </div>
      </div>`;
  }).join('');
  const orderedParts = [...state.massParts].sort((a,b)=>{
    const ia = DEFAULT_MASS_PARTS.indexOf(a);
    const ib = DEFAULT_MASS_PARTS.indexOf(b);
    if(ia >= 0 && ib >= 0) return ia - ib;
    if(ia >= 0) return -1;
    if(ib >= 0) return 1;
    return 0;
  });
  const massPartItems = orderedParts.map(mp=>{
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
        <div class="side-item" data-goto-all="1" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;"><span style="display:flex;align-items:center;flex-shrink:0;">${iconMusic()}</span><span style="flex:1;text-align:left;">All Songs</span></div>
        <div class="side-item" data-goto-fav="1" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;"><span style="display:flex;align-items:center;flex-shrink:0;color:var(--chord);">${iconStar(true)}</span><span style="flex:1;text-align:left;">Favorites</span></div>
        <div class="side-item" data-goto-setlists="1" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;"><span style="display:flex;align-items:center;flex-shrink:0;">${iconSetlist()}</span><span style="flex:1;text-align:left;">Setlists / Mass Plans</span><span class="side-count">${state.setlists.length}</span></div>
        <div class="side-section-label" style="display:flex;align-items:center;justify-content:space-between;"><span>FOLDERS / SEASONS</span><span style="font-size:9.5px;color:var(--accent);font-weight:700;letter-spacing:0.5px;">&#9729; Database</span></div>
        ${folderItems}
        <div class="side-item side-add" id="side-add-folder"><span>+ New folder</span></div>
        <div class="side-section-label">BROWSE BY MASS PART</div>
        ${massPartItems}
        <div class="side-item side-add" id="side-add-masspart"><span>+ New Mass Part</span></div>
        <div class="side-item side-add" id="side-import-gsma" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;"><span style="display:flex;align-items:center;flex-shrink:0;">${iconImport()}</span><span style="flex:1;text-align:left;">Import .gsma / .gsm</span><input type="file" id="gsma-file-input" accept=".gsma,.gsm,.txt" style="display:none;"/></div>
        <div class="side-item side-add" id="side-export-gsma" style="display:flex;align-items:center;justify-content:flex-start;gap:10px;"><span style="display:flex;align-items:center;flex-shrink:0;">${iconExport()}</span><span style="flex:1;text-align:left;">Export .gsma</span></div>
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
  // (2026-07-13) wire sidebar folder edit modal; prev: inline swatches
  document.querySelectorAll('[data-goto-folder]').forEach(el=>{
    el.onclick = (e)=>{
      if(e.target.closest('[data-rename-folder],[data-del-folder]')) return;
      closeSidebar(()=>{ state.filterCat = el.dataset.gotoFolder; state.filterMassPart=null; renderListView(); });
    };
  });
  document.querySelectorAll('[data-rename-folder]').forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      const folderName = btn.dataset.renameFolder;
      closeSidebar(()=>{
        state.modal = { type: 'edit-folder', folder: folderName, search: '' };
        render();
      });
    };
  });
  document.querySelectorAll('[data-del-folder]').forEach(btn=>{
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const cat = btn.dataset.delFolder;
      if(confirm(`Delete folder "${cat}" from database? Songs inside won't be deleted.`)){
        state.categories = state.categories.filter(c=>c!==cat);
        await Store.saveCategories(state.categories);
        const affected = state.songs.filter(s=>(s.categories||[]).includes(cat));
        for(const s of affected){
          s.categories = s.categories.filter(c=>c!==cat);
          await Store.saveSong(s);
        }
        if(state.filterCat===cat) state.filterCat = 'All';
        showToast('Folder deleted from database');
        render();
      }
    };
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
  // (2026-07-13) wire sidebar export gsma button; prev: none
  const exportBtn = document.getElementById('side-export-gsma');
  if(exportBtn){
    exportBtn.onclick = ()=>{
      closeSidebar(()=>{
        state.modal = { type: 'export-gsma' };
        render();
      });
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
  // (2026-07-13) clean folder modal rows & lock massparts to fixed order; prev: inline swatches & mp sort
  if(state.modal.type==='sort-folders' || state.modal.type==='categories'){
    const items = state.categories.map((c, idx)=>{
      const ct = getFolderTheme(c);
      const count = state.songs.filter(s=>(s.categories||[]).includes(c)).length;
      return `
      <div class="cat-item" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 6px;">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;overflow:hidden;">
          <span style="display:inline-flex;align-items:center;width:16px;height:16px;color:${ct.swatch};flex-shrink:0;">${iconFolder()}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;color:var(--text);">${escapeHtml(c)}</span>
          <span class="side-count" style="flex-shrink:0;">${count}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;flex:0 0 auto;">
          <button class="item-reorder-btn" data-folder-up="${idx}" title="Move Up" ${idx===0?'disabled':''}>&uarr;</button>
          <button class="item-reorder-btn" data-folder-down="${idx}" title="Move Down" ${idx===state.categories.length-1?'disabled':''}>&darr;</button>
          <button class="icon-btn" data-rename-cat="${escapeHtml(c)}" title="Edit folder name, color & songs" style="width:26px;height:26px;padding:3px;opacity:0.85;">${iconEdit()}</button>
          <button class="icon-btn" data-del="${escapeHtml(c)}" title="Delete folder from database" style="width:26px;height:26px;padding:3px;opacity:0.75;color:var(--danger);">${iconTrash()}</button>
        </div>
      </div>`;
    }).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <h3 style="margin:0;">Folders</h3>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:10px;font-weight:700;color:var(--accent);letter-spacing:0.5px;">&#9729; Database Synced</span>
              <button class="icon-btn" id="modal-x" style="width:28px;height:28px;">${iconClose()}</button>
            </div>
          </div>
          <div class="sort-actions-bar">
            <button class="sort-chip-btn" id="btn-sort-folders-az">Sort A &rarr; Z</button>
            <button class="sort-chip-btn" id="btn-sort-folders-za">Sort Z &rarr; A</button>
            <button class="sort-chip-btn" id="btn-sort-folders-count">By Song Count</button>
          </div>
          <div class="cat-list" style="max-height:280px;overflow-y:auto;margin-bottom:12px;">
            ${items}
          </div>
          <div class="add-cat-row">
            <input id="new-cat-input" placeholder="New folder name, e.g. Lent Songs"/>
            <button class="btn btn-primary" style="flex:0 0 auto;padding:10px 16px" id="add-cat-btn">Add</button>
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) add edit-folder modal for name, color & songs; prev: none
  if(state.modal.type==='edit-folder'){
    const folder = state.modal.folder;
    const searchQ = (state.modal.search || '').trim().toLowerCase();
    const curColor = (state.folderColors && state.folderColors[folder]) || 'gold';
    const ct = getFolderTheme(folder);
    const swatches = Object.values(FOLDER_THEMES).map(t=>`
      <button class="theme-swatch-btn ${curColor===t.key?'selected':''}" data-edit-folder-color="${t.key}" title="${t.label}" style="background:${t.swatch};"></button>
    `).join('');
    const matchingSongs = state.songs.filter(s=>{
      if(!searchQ) return true;
      return (s.title||'').toLowerCase().includes(searchQ) || (s.artist||'').toLowerCase().includes(searchQ);
    });
    const inCount = state.songs.filter(s=>(s.categories||[]).includes(folder)).length;
    const songItems = matchingSongs.map(s=>{
      const inFolder = (s.categories||[]).includes(folder);
      return `
        <div class="cat-item" data-toggle-folder-song="${escapeHtml(s.id)}" style="display:flex;align-items:center;gap:10px;padding:8px 6px;cursor:pointer;">
          <button type="button" class="song-check-btn ${inFolder?'checked':''}" style="pointer-events:none;">${inFolder?iconCheck():''}</button>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.title)}</div>
            <div style="font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.artist||'Unknown')}</div>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h3 style="margin:0;display:flex;align-items:center;gap:8px;color:${ct.swatch};">
              <span style="display:inline-flex;width:18px;height:18px;">${iconFolder()}</span>
              <span>Edit Folder</span>
            </h3>
            <button class="icon-btn" id="modal-x">${iconClose()}</button>
          </div>
          <div class="field" style="margin-bottom:12px;">
            <label>Folder Name</label>
            <div style="display:flex;gap:8px;">
              <input id="edit-folder-name-input" value="${escapeHtml(state.modal.draftName !== undefined ? state.modal.draftName : folder)}" style="padding:8px 12px;font-size:13.5px;"/>
              <button class="btn btn-primary" id="btn-save-folder-name" style="flex:0 0 auto;padding:8px 14px;min-height:38px;font-size:13px;">Rename</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:12px;">
            <label>Folder & Chip Color Theme (${escapeHtml(ct.label)})</label>
            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
              ${swatches}
            </div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label style="display:flex;align-items:center;justify-content:space-between;">
              <span>Songs in Folder (${inCount})</span>
              <span style="font-size:10px;color:var(--text-dim);text-transform:none;">Tap to add / remove</span>
            </label>
            <input id="edit-folder-song-search" placeholder="Search songs to add or remove..." value="${escapeHtml(state.modal.search||'')}" style="padding:7px 11px;font-size:12.5px;margin-bottom:8px;"/>
            <div class="cat-list" id="edit-folder-song-list" style="max-height:220px;overflow-y:auto;border:1px solid var(--line);border-radius:10px;padding:4px;">
              ${songItems || '<div class="empty-state" style="padding:20px;">No matching songs</div>'}
            </div>
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) add confirmation modal before renaming folder; prev: direct rename
  if(state.modal.type==='confirm-rename-folder'){
    const oldName = state.modal.folder;
    const newName = state.modal.newName;
    const ct = getFolderTheme(oldName);
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card" style="max-width:340px;">
          <h3 style="margin:0 0 10px;display:flex;align-items:center;gap:8px;color:${ct.swatch};">
            <span style="display:inline-flex;width:18px;height:18px;">${iconFolder()}</span>
            <span>Confirm Rename</span>
          </h3>
          <div style="font-size:13.5px;color:var(--text-dim);line-height:1.5;margin-bottom:18px;">
            ${newName !== oldName
              ? `Rename folder <b style="color:var(--text);">"${escapeHtml(oldName)}"</b> to <b style="color:${ct.swatch};">"${escapeHtml(newName)}"</b>?`
              : `Save changes to folder <b style="color:${ct.swatch};">"${escapeHtml(oldName)}"</b>?`}
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-secondary" id="btn-cancel-rename-folder" style="min-height:42px;padding:10px;">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-rename-folder" style="min-height:42px;padding:10px;">Confirm</button>
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) lock Mass Parts modal to fixed Mass order without sort/reorder; prev: sortable
  if(state.modal.type==='massparts'){
    const orderedParts = [...state.massParts].sort((a,b)=>{
      const ia = DEFAULT_MASS_PARTS.indexOf(a);
      const ib = DEFAULT_MASS_PARTS.indexOf(b);
      if(ia >= 0 && ib >= 0) return ia - ib;
      if(ia >= 0) return -1;
      if(ib >= 0) return 1;
      return 0;
    });
    const items = orderedParts.map((c, idx)=>{
      const count = state.songs.filter(s=>(s.massParts||[]).includes(c)).length;
      return `
      <div class="cat-item" style="display:flex;align-items:center;justify-content:space-between;padding:9px 6px;">
        <div style="display:flex;align-items:center;gap:9px;min-width:0;flex:1;overflow:hidden;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:6px;background:var(--chord-dim);color:var(--chord);font-size:10.5px;font-weight:800;flex-shrink:0;">${idx+1}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;">${escapeHtml(c)}</span>
          <span class="side-count" style="flex-shrink:0;">${count}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;flex:0 0 auto;">
          <button class="icon-btn" data-rename-mp="${escapeHtml(c)}" title="Rename Mass Part in database" style="width:26px;height:26px;padding:3px;opacity:0.8;">${iconEdit()}</button>
          <button class="icon-btn" data-del-mp="${escapeHtml(c)}" title="Delete Mass Part from database" style="width:26px;height:26px;padding:3px;opacity:0.75;color:var(--danger);">${iconTrash()}</button>
        </div>
      </div>`;
    }).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <h3 style="margin:0;">Mass Parts</h3>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:10px;font-weight:700;color:var(--chord);letter-spacing:0.5px;">&#10022; Fixed Mass Order</span>
              <button class="icon-btn" id="modal-x" style="width:28px;height:28px;">${iconClose()}</button>
            </div>
          </div>
          <div style="font-size:11.5px;color:var(--text-dim);margin-bottom:10px;">Follows the standard liturgical sequence of the Mass.</div>
          <div class="cat-list" style="max-height:260px;overflow-y:auto;margin-bottom:12px;">
            ${items}
          </div>
          <div class="add-cat-row">
            <input id="new-mp-input" placeholder="New Mass Part, e.g. Communion"/>
            <button class="btn btn-primary" style="flex:0 0 auto;padding:10px 16px" id="add-mp-btn">Add</button>
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) color folder chips by theme in song-context modal; prev: default orange
  if(state.modal.type==='song-context'){
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return '';
    const isExcluded = isSongExcluded(song);
    const scopeLabel = state.filterMassPart || state.filterCat || 'All';
    const folderToggles = state.categories.map(c=>{
      const ct = getFolderTheme(c);
      const isSel = (song.categories||[]).includes(c);
      const st = isSel ? `background:${ct.dim};border-color:${ct.accent};color:${ct.accent};` : `border-color:${ct.dim};`;
      return `<div class="cat-toggle ${isSel?'selected':''}" data-ctx-folder="${escapeHtml(c)}" style="${st}"><span class="chip-dot" style="background:${ct.swatch};margin-right:6px;"></span>${escapeHtml(c)}</div>`;
    }).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <h3>${escapeHtml(song.title)}</h3>
          <div style="display:flex;gap:10px;margin-bottom:10px;">
            <button class="btn btn-secondary" id="ctx-edit">Edit song</button>
            <button class="btn btn-danger" id="ctx-delete">Delete</button>
          </div>
          <div style="margin-bottom:16px;">
            <button class="btn ${isExcluded?'btn-primary':'btn-secondary'}" id="ctx-toggle-exclude" style="width:100%;min-height:42px;padding:10px;">
              ${isExcluded ? `Include in "${escapeHtml(scopeLabel)}" Swipe Order` : `Exclude (Skip on Swipe in "${escapeHtml(scopeLabel)}")`}
            </button>
          </div>
          <div class="field">
            <label>Add to folder(s)</label>
            <div class="cat-toggle-wrap">${folderToggles}</div>
            <div class="hint">Tap any folder to file this same song there too — it's still one song, edited in one place.</div>
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) modal for batch adding selected songs to a folder; prev: none
  if(state.modal.type==='batch-add-folder'){
    const count = (state.modal.songIds || []).length;
    const folderChips = state.categories.map(c=>{
      const ct = getFolderTheme(c);
      return `<button class="cat-toggle" data-batch-folder="${escapeHtml(c)}" style="border-color:${ct.dim};background:transparent;cursor:pointer;display:inline-flex;align-items:center;padding:7px 12px;border-radius:20px;font-size:13px;font-weight:600;"><span class="chip-dot" style="background:${ct.swatch};margin-right:7px;"></span>${escapeHtml(c)}</button>`;
    }).join('');
    return `
      <div class="modal-backdrop" id="modal-bg">
        <div class="modal">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <h3 style="margin:0;">Add to Folder</h3>
            <button class="icon-btn" id="modal-x" style="width:28px;height:28px;">${iconClose()}</button>
          </div>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:14px;">Select destination folder for <strong>${count}</strong> selected song(s):</div>
          <div class="cat-toggle-wrap" style="display:flex;flex-wrap:wrap;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:12px;">
            ${folderChips || '<div style="color:var(--text-dim);font-size:12px;">No folders created yet.</div>'}
          </div>
        </div>
      </div>`;
  }
  // (2026-07-13) export gsma modal dialog; prev: none
  if(state.modal.type==='export-gsma'){
    const currentScope = state.filterCat || 'All';
    const folderSongs = currentScope === 'All' ? state.songs : state.songs.filter(s=>(s.categories||[]).includes(currentScope));
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card" style="max-width:320px;">
          <button class="icon-btn modal-close" id="modal-x">${iconClose()}</button>
          <h3 style="text-align:center;">Export .gsma</h3>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:14px;text-align:center;">
            Export songs in standard .gsma format compatible with backup and import.
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${currentScope !== 'All' ? `
              <button class="btn btn-primary" id="btn-export-current-scope" style="width:100%;padding:10px;">
                Export "${escapeHtml(currentScope)}" (${folderSongs.length})
              </button>
            ` : ''}
            <button class="btn ${currentScope==='All'?'btn-primary':'btn-secondary'}" id="btn-export-all-songs" style="width:100%;padding:10px;">
              Export All Songs (${state.songs.length})
            </button>
          </div>
          <div style="margin-top:14px;">
            <button class="btn btn-secondary" id="adj-done" style="width:100%;">Done</button>
          </div>
        </div>
      </div>`;
  }
// (2026-07-13) adjust modal autoscroll speed & done btn; prev: text size only
  if(state.modal.type==='adjust'){
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return '';
    const offset = song.transposeOffset||0;
    const beatsPerBar = parseInt((song.timeSig||'4/4').split('/')[0]) || 4;
    let beatDots = '';
    for(let i=0;i<beatsPerBar;i++) beatDots += `<span class="beat-dot" data-beat="${i}"></span>`;
    return `
      <div class="modal-backdrop center" id="modal-bg">
        <div class="modal card" style="max-width:310px;">
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
            <label>Text size (${song.viewerFontSize||15}px)</label>
            <div style="display:flex;gap:8px;">
              <button class="toolbtn" style="flex:1;" id="adj-zoom-down">A&minus;</button>
              <button class="toolbtn" style="flex:1;" id="adj-zoom-up">A+</button>
            </div>
          </div>
          <div class="field">
            <label>Autoscroll Speed (<span id="adj-speed-val">${song.viewerScrollSpeed||30}</span>)</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="range" id="adj-speed-slider" min="5" max="100" value="${song.viewerScrollSpeed||30}" style="flex:1;">
            </div>
          </div>
          <div style="margin-top:14px;display:flex;gap:8px;">
            <button class="btn btn-secondary" id="adj-edit" style="flex:1;">Edit Details</button>
            <button class="btn btn-primary" id="adj-done" style="flex:1;">Done</button>
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
  // (2026-07-13) show SongTitle saved toast when closing song-context modal; prev: silent close
  // (2026-07-13) reliable modal backdrop, done & close button dismissal; prev: stuck modal
  const closeActiveModal = ()=>{
    const closingModal = state.modal;
    state.modal = null;
    render();
    if(closingModal && closingModal.type === 'song-context' && closingModal.dirty){
      const s = state.songs.find(item=>item.id===closingModal.id);
      if(s) showToast(`${s.title} saved.`);
    }
  };
  bg.onclick = (e)=>{
    if(e.target===bg || e.target.closest('#modal-x, .modal-close, #adj-done, [data-modal-close]')){
      closeActiveModal();
    }
  };
  bg.ontouchend = (e)=>{
    if(e.target===bg){
      e.preventDefault();
      closeActiveModal();
    }
  };
  const x = document.getElementById('modal-x');
  if(x) x.onclick = ()=>{ closeActiveModal(); };
  const doneBtn = document.getElementById('adj-done');
  if(doneBtn) doneBtn.onclick = ()=>{ closeActiveModal(); };
  document.querySelectorAll('.diagram-tabs button').forEach(b=>{
    b.onclick = ()=>{ state.modal.tab = b.dataset.tab; render(); };
  });
  // (2026-07-13) wire folder color swatches & rename in modal; prev: delete only
  document.querySelectorAll('[data-modal-folder]').forEach(btn=>{
    btn.onclick = async ()=>{
      const folder = btn.dataset.modalFolder;
      const color = btn.dataset.modalColor;
      if(!state.folderColors) state.folderColors = {};
      state.folderColors[folder] = color;
      if(state.filterCat === folder) applyFolderTheme(folder);
      await Store.saveFolderColors(state.folderColors);
      render();
    };
  });
  const addBtn = document.getElementById('add-cat-btn');
  if(addBtn) addBtn.onclick = async ()=>{
    const val = document.getElementById('new-cat-input').value.trim();
    if(val && !state.categories.includes(val)){
      state.categories.push(val);
      await Store.saveCategories(state.categories);
      showToast('Folder created & saved to database');
      render();
    }
  };
  // (2026-07-13) wire edit-folder modal name, color & song toggles; prev: prompt only
  document.querySelectorAll('[data-rename-cat]').forEach(btn=>{
    btn.onclick = ()=>{
      const folderName = btn.dataset.renameCat;
      state.modal = { type: 'edit-folder', folder: folderName, search: '' };
      render();
    };
  });
  // (2026-07-13) open confirm-rename-folder modal then close & toast; prev: stay open
  const saveFolderNameBtn = document.getElementById('btn-save-folder-name');
  if(saveFolderNameBtn){
    saveFolderNameBtn.onclick = ()=>{
      const oldName = state.modal.folder;
      const inp = document.getElementById('edit-folder-name-input');
      const newName = inp ? inp.value.trim() : '';
      if(!newName) return;
      state.modal = {
        type: 'confirm-rename-folder',
        folder: oldName,
        newName,
        search: state.modal.search || ''
      };
      render();
    };
  }
  const cancelRenameFolderBtn = document.getElementById('btn-cancel-rename-folder');
  if(cancelRenameFolderBtn){
    cancelRenameFolderBtn.onclick = ()=>{
      state.modal = {
        type: 'edit-folder',
        folder: state.modal.folder,
        draftName: state.modal.newName,
        search: state.modal.search || ''
      };
      render();
    };
  }
  const confirmRenameFolderBtn = document.getElementById('btn-confirm-rename-folder');
  if(confirmRenameFolderBtn){
    confirmRenameFolderBtn.onclick = async ()=>{
      const oldName = state.modal.folder;
      const newName = state.modal.newName;
      if(newName && newName !== oldName){
        const idx = state.categories.indexOf(oldName);
        if(idx >= 0){
          state.categories[idx] = newName;
          await Store.saveCategories(state.categories);
          if(state.folderColors && state.folderColors[oldName]){
            state.folderColors[newName] = state.folderColors[oldName];
            delete state.folderColors[oldName];
            await Store.saveFolderColors(state.folderColors);
          }
          const affected = state.songs.filter(s=>(s.categories||[]).includes(oldName) || (s.excludedFolders||[]).includes(oldName));
          for(const s of affected){
            if(Array.isArray(s.categories)) s.categories = s.categories.map(c=>c===oldName ? newName : c);
            if(Array.isArray(s.excludedFolders)) s.excludedFolders = s.excludedFolders.map(c=>c===oldName ? newName : c);
            await Store.saveSong(s);
          }
          if(state.filterCat===oldName) state.filterCat = newName;
        }
      }
      state.modal = null;
      render();
      showToast(`Folder renamed to "${newName}"`);
    };
  }
  document.querySelectorAll('[data-edit-folder-color]').forEach(btn=>{
    btn.onclick = async ()=>{
      const folder = state.modal.folder;
      const color = btn.dataset.editFolderColor;
      if(!state.folderColors) state.folderColors = {};
      state.folderColors[folder] = color;
      if(state.filterCat === folder) applyFolderTheme(folder);
      await Store.saveFolderColors(state.folderColors);
      render();
    };
  });
  // (2026-07-13) update folder song list in-place on search input; prev: full render
  const wireFolderSongRows = ()=>{
    document.querySelectorAll('[data-toggle-folder-song]').forEach(row=>{
      row.onclick = async ()=>{
        const folder = state.modal.folder;
        const songId = row.dataset.toggleFolderSong;
        const song = state.songs.find(s=>s.id===songId);
        if(!song) return;
        if(!Array.isArray(song.categories)) song.categories = [];
        if(song.categories.includes(folder)){
          song.categories = song.categories.filter(c=>c!==folder);
        } else {
          song.categories.push(folder);
        }
        await Store.saveSong(song);
        render();
      };
    });
  };
  wireFolderSongRows();
  const folderSongSearch = document.getElementById('edit-folder-song-search');
  if(folderSongSearch){
    folderSongSearch.oninput = (e)=>{
      state.modal.search = e.target.value;
      const folder = state.modal.folder;
      const searchQ = (state.modal.search || '').trim().toLowerCase();
      const matchingSongs = state.songs.filter(s=>{
        if(!searchQ) return true;
        return (s.title||'').toLowerCase().includes(searchQ) || (s.artist||'').toLowerCase().includes(searchQ);
      });
      const listEl = document.getElementById('edit-folder-song-list');
      if(listEl){
        listEl.innerHTML = matchingSongs.map(s=>{
          const inFolder = (s.categories||[]).includes(folder);
          return `
            <div class="cat-item" data-toggle-folder-song="${escapeHtml(s.id)}" style="display:flex;align-items:center;gap:10px;padding:8px 6px;cursor:pointer;">
              <button type="button" class="song-check-btn ${inFolder?'checked':''}" style="pointer-events:none;">${inFolder?iconCheck():''}</button>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.title)}</div>
                <div style="font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.artist||'Unknown')}</div>
              </div>
            </div>`;
        }).join('') || '<div class="empty-state" style="padding:20px;">No matching songs</div>';
        wireFolderSongRows();
      }
    };
  }
  document.querySelectorAll('[data-del]').forEach(el=>{
    el.onclick = async ()=>{
      const cat = el.dataset.del;
      if(confirm(`Delete folder "${cat}" from database? Songs inside won't be deleted.`)){
        state.categories = state.categories.filter(c=>c!==cat);
        await Store.saveCategories(state.categories);
        const affected = state.songs.filter(s=>(s.categories||[]).includes(cat));
        for(const s of affected){
          s.categories = s.categories.filter(c=>c!==cat);
          await Store.saveSong(s);
        }
        if(state.filterCat===cat) state.filterCat = 'All';
        showToast('Folder deleted from database');
        render();
      }
    };
  });
  // (2026-07-13) wire mass parts & folder sorting with database persistence; prev: basic
  const sortAzBtn = document.getElementById('btn-sort-folders-az');
  if(sortAzBtn) sortAzBtn.onclick = async ()=>{
    state.categories.sort((a,b)=>a.localeCompare(b));
    await Store.saveCategories(state.categories);
    showToast('Folders sorted A-Z & saved to database');
    render();
  };
  const sortZaBtn = document.getElementById('btn-sort-folders-za');
  if(sortZaBtn) sortZaBtn.onclick = async ()=>{
    state.categories.sort((a,b)=>b.localeCompare(a));
    await Store.saveCategories(state.categories);
    showToast('Folders sorted Z-A & saved to database');
    render();
  };
  const sortCountBtn = document.getElementById('btn-sort-folders-count');
  if(sortCountBtn) sortCountBtn.onclick = async ()=>{
    state.categories.sort((a,b)=>{
      const ca = state.songs.filter(s=>(s.categories||[]).includes(a)).length;
      const cb = state.songs.filter(s=>(s.categories||[]).includes(b)).length;
      return cb - ca;
    });
    await Store.saveCategories(state.categories);
    showToast('Folders sorted by count & saved to database');
    render();
  };
  document.querySelectorAll('[data-folder-up]').forEach(btn=>{
    btn.onclick = async ()=>{
      const idx = +btn.dataset.folderUp;
      if(idx > 0){
        [state.categories[idx-1], state.categories[idx]] = [state.categories[idx], state.categories[idx-1]];
        await Store.saveCategories(state.categories);
        showToast('Folder order saved to database');
        render();
      }
    };
  });
  document.querySelectorAll('[data-folder-down]').forEach(btn=>{
    btn.onclick = async ()=>{
      const idx = +btn.dataset.folderDown;
      if(idx < state.categories.length-1){
        [state.categories[idx+1], state.categories[idx]] = [state.categories[idx], state.categories[idx+1]];
        await Store.saveCategories(state.categories);
        showToast('Folder order saved to database');
        render();
      }
    };
  });
  // (2026-07-13) remove masspart sorting handlers so Mass order is fixed; prev: sortable
  document.querySelectorAll('[data-rename-mp]').forEach(btn=>{
    btn.onclick = async ()=>{
      const oldName = btn.dataset.renameMp;
      const newName = prompt('Rename Mass Part in database:', oldName);
      if(newName && newName.trim() && newName.trim() !== oldName){
        const trimmed = newName.trim();
        const idx = state.massParts.indexOf(oldName);
        if(idx >= 0){
          state.massParts[idx] = trimmed;
          await Store.saveMassParts(state.massParts);
          const affected = state.songs.filter(s=>(s.massParts||[]).includes(oldName));
          for(const s of affected){
            s.massParts = s.massParts.map(p=>p===oldName ? trimmed : p);
            await Store.saveSong(s);
          }
          if(state.filterMassPart===oldName) state.filterMassPart = trimmed;
          showToast('Mass part updated in database');
          render();
        }
      }
    };
  });
  const addMpBtn = document.getElementById('add-mp-btn');
  if(addMpBtn) addMpBtn.onclick = async ()=>{
    const val = document.getElementById('new-mp-input').value.trim();
    if(val && !state.massParts.includes(val)){
      state.massParts.push(val);
      await Store.saveMassParts(state.massParts);
      showToast('Mass part pushed & saved to database');
      render();
    }
  };
  document.querySelectorAll('[data-del-mp]').forEach(el=>{
    el.onclick = async ()=>{
      const mp = el.dataset.delMp;
      if(confirm(`Delete Mass Part "${mp}" from database? Songs will keep other details.`)){
        state.massParts = state.massParts.filter(c=>c!==mp);
        await Store.saveMassParts(state.massParts);
        const affected = state.songs.filter(s=>(s.massParts||[]).includes(mp));
        for(const s of affected){
          s.massParts = s.massParts.filter(c=>c!==mp);
          await Store.saveSong(s);
        }
        if(state.filterMassPart===mp) state.filterMassPart = null;
        showToast('Mass part deleted from database');
        render();
      }
    };
  });
  const ctxEdit = document.getElementById('ctx-edit');
  if(ctxEdit) ctxEdit.onclick = ()=>{ const id = state.modal.id; state.modal=null; openEditor(id); };
  const ctxToggleEx = document.getElementById('ctx-toggle-exclude');
  if(ctxToggleEx) ctxToggleEx.onclick = async ()=>{
    const id = state.modal.id;
    state.modal = null;
    await toggleSongIncludeExclude(id);
  };
  const ctxDelete = document.getElementById('ctx-delete');
  if(ctxDelete) ctxDelete.onclick = async ()=>{
    if(confirm('Delete this song? This cannot be undone.')){
      await Store.deleteSong(state.modal.id);
      state.songs = state.songs.filter(s=>s.id!==state.modal.id);
      state.modal = null;
      render();
    }
  };
  // (2026-07-13) toggle folder chips in-place without re-opening modal; prev: render() on click
  document.querySelectorAll('[data-ctx-folder]').forEach(el=>{
    el.onclick = async ()=>{
      const song = state.songs.find(s=>s.id===state.modal.id);
      if(!song) return;
      const cat = el.dataset.ctxFolder;
      const ct = getFolderTheme(cat);
      song.categories = song.categories || [];
      const idx = song.categories.indexOf(cat);
      const nowSel = idx < 0;
      if(idx>=0) song.categories.splice(idx,1); else song.categories.push(cat);
      el.classList.toggle('selected', nowSel);
      el.style.background = nowSel ? ct.dim : '';
      el.style.borderColor = nowSel ? ct.accent : ct.dim;
      el.style.color = nowSel ? ct.accent : '';
      if(state.modal) state.modal.dirty = true;
      await Store.saveSong(song);
    };
  });
  // (2026-07-13) wire batch add selected songs to folder; prev: none
  document.querySelectorAll('[data-batch-folder]').forEach(btn=>{
    btn.onclick = async ()=>{
      const cat = btn.dataset.batchFolder;
      const songIds = (state.modal && state.modal.songIds) || [];
      for(const sid of songIds){
        const s = state.songs.find(item=>item.id===sid);
        if(s){
          if(!Array.isArray(s.categories)) s.categories = [];
          if(!s.categories.includes(cat)){
            s.categories.push(cat);
            await Store.saveSong(s);
          }
        }
      }
      showToast(`${songIds.length} song(s) added to "${cat}"`);
      state.modal = null;
      state.checkedSongIds = [];
      state.listEditMode = false;
      render();
    };
  });
  // (2026-07-13) wire export gsma modal download handlers; prev: none
  const expScopeBtn = document.getElementById('btn-export-current-scope');
  if(expScopeBtn){
    expScopeBtn.onclick = ()=>{
      const scope = state.filterCat || 'Folder';
      const songs = state.songs.filter(s=>(s.categories||[]).includes(scope));
      const text = generateGSMA(songs, scope);
      downloadGSMA(`${scope}.gsma`, text);
      showToast(`Exported ${songs.length} song(s) to "${scope}.gsma"`);
      state.modal = null;
      render();
    };
  }
  const expAllBtn = document.getElementById('btn-export-all-songs');
  if(expAllBtn){
    expAllBtn.onclick = ()=>{
      const text = generateGSMA(state.songs, 'All Songs');
      downloadGSMA('Choir Book Pro - All Songs.gsma', text);
      showToast(`Exported all ${state.songs.length} song(s)`);
      state.modal = null;
      render();
    };
  }
  const modalCancelBtn = document.getElementById('modal-cancel');
  if(modalCancelBtn){
    modalCancelBtn.onclick = ()=>{ state.modal = null; render(); };
  }
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
  // (2026-07-13) persist zoom & scroll speed to db in adjust modal; prev: font only
  const adjZoomUp = document.getElementById('adj-zoom-up');
  if(adjZoomUp) adjZoomUp.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return;
    song.viewerFontSize = Math.min(36, (song.viewerFontSize||15)+2);
    const idx = state.songs.findIndex(s=>s.id===song.id);
    if(idx>=0) state.songs[idx] = song;
    await Store.saveSong(song); render();
  };
  const adjZoomDown = document.getElementById('adj-zoom-down');
  if(adjZoomDown) adjZoomDown.onclick = async ()=>{
    const song = state.songs.find(s=>s.id===state.modal.id);
    if(!song) return;
    song.viewerFontSize = Math.max(10, (song.viewerFontSize||15)-2);
    const idx = state.songs.findIndex(s=>s.id===song.id);
    if(idx>=0) state.songs[idx] = song;
    await Store.saveSong(song); render();
  };
  const adjSpeedSlider = document.getElementById('adj-speed-slider');
  if(adjSpeedSlider){
    adjSpeedSlider.oninput = async (e)=>{
      const newSpeed = parseInt(e.target.value, 10) || 30;
      const song = state.songs.find(s=>s.id===state.modal.id);
      if(!song) return;
      song.viewerScrollSpeed = newSpeed;
      const idx = state.songs.findIndex(s=>s.id===song.id);
      if(idx>=0) state.songs[idx] = song;
      const valLabel = document.getElementById('adj-speed-val');
      if(valLabel) valLabel.textContent = newSpeed;
      const onScreenSlider = document.getElementById('speed-range-slider');
      if(onScreenSlider) onScreenSlider.value = newSpeed;
      await Store.saveSong(song);
    };
  }

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
// (2026-07-13) export arrow icon; prev: none
function iconExport(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`; }
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
// (2026-07-13) add check, drag-bars, palette, cross & people svg icons; prev: chevrons only
function iconCheck(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`; }
function iconCheckSmall(){ return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`; }
function iconDragBars(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`; }
function iconPalette(){ return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h1.99c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/></svg>`; }
function iconPriestCross(){ return `<svg class="badge-svg" viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M6.8 1h2.4v4h3.8v2.4H9.2v7.6H6.8V7.4H3V5h3.8V1z"/></svg>`; }
function iconPeopleGroup(){ return `<svg class="badge-svg" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M5.5 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm5.5-.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 8.5C2.8 8.5 1 9.9 1 11.8V13h9v-1.2c0-1.9-1.8-3.3-4.5-3.3zm5.5.5c-.5 0-1 .1-1.5.2.9.7 1.5 1.6 1.5 2.6V13h4v-1c0-1.6-1.5-3-4-3z"/></svg>`; }
function iconCueHide(){ return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`; }
function iconCueShow(){ return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`; }
function iconChevronLeft(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconChevronRight(){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconBigTriangleUp(){ return `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M30 4 L54 34 L6 34 Z" fill="currentColor"/></svg>`; }
function iconBigTriangleDown(){ return `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M30 36 L6 6 L54 6 Z" fill="currentColor"/></svg>`; }

/* ============================================================
   SERVICE WORKER (offline shell caching for fast loads)
   ============================================================ */
// (2026-07-13) purge legacy sw caches & update service workers; prev: register only
if('caches' in window){
  caches.keys().then(keys=>{
    keys.filter(k=>k!=='songbook-shell-v31').forEach(k=>caches.delete(k));
  }).catch(()=>{});
}
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.getRegistrations().then(regs=>{
      regs.forEach(r=>r.update());
    }).catch(()=>{});
    navigator.serviceWorker.register('./sw.js').catch(()=>{
      navigator.serviceWorker.register('./js/sw.js').catch(()=>{});
    });
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
            if(localStorage.getItem(docId) === val){
              return;
            }
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
            } else if(docId === 'meta:folderColors'){
              try{ state.folderColors = JSON.parse(val) || {}; applyFolderTheme(state.filterCat); changed = true; }catch(e){}
            }
          }
        });
        // (2026-07-13) skip render on local snapshot echo or active modal; prev: render()
        if(changed && !state.loading && !state.modal){ render(); }
      }, (err) => { console.warn('Realtime snapshot notice:', err); });
  }catch(e){ console.error('Snapshot error', e); }
}

// (2026-07-13) handle redirect auth result & local persistence; prev: listener only
(async function boot(){
  if(FIREBASE_READY){
    try{ await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); }catch(e){}
    try{ await firebase.auth().getRedirectResult(); }catch(e){}
    firebase.auth().onAuthStateChanged(async (user)=>{
      firebaseUser = user;
      selectAdapter();
      if(user){
        subscribeRealtimeSync();
        state.view = 'list';
        state.loading = false;
        render();
        try{ await seedIfEmpty(); }catch(e){}
        loadAll().catch(()=>{});
      } else {
        if(unsubscribeSnapshot){ unsubscribeSnapshot(); unsubscribeSnapshot = null; }
        state.view = 'auth';
        state.loading = false;
        render();
      }
    });
  } else {
    state.loading = false;
    render();
    try{ await seedIfEmpty(); }catch(e){}
    loadAll().catch(()=>{});
  }
})();

})();
