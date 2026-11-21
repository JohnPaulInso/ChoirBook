/* ============================================================
   CHOIR BOOK PRO — IMAGE-TO-LYRICS OCR SCANNER & SONG EXPORTER
   (2026-07-13) OCR image scanner + 1/2-col PNG/PDF/Word export
   ============================================================ */
(function(){
  'use strict';

  let tesseractLoadPromise = null;
  function loadTesseract(){
    if(window.Tesseract) return Promise.resolve(window.Tesseract);
    if(tesseractLoadPromise) return tesseractLoadPromise;
    tesseractLoadPromise = new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.async = true;
      s.onload = ()=> window.Tesseract ? resolve(window.Tesseract) : reject(new Error('OCR engine unavailable'));
      s.onerror = ()=>{ tesseractLoadPromise = null; reject(new Error('Failed to load OCR engine (check internet connection)')); };
      document.head.appendChild(s);
    });
    return tesseractLoadPromise;
  }

  // (2026-07-13) return preprocessed canvas & auto-detect 2-column gutter; prev: flat dataURL
  function preprocessImageToCanvas(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onerror = ()=> reject(new Error('Could not read image'));
      reader.onload = ()=>{
        const img = new Image();
        img.onerror = ()=> reject(new Error('Invalid image file'));
        img.onload = ()=>{
          const targetW = Math.min(2000, Math.max(img.width, 1200));
          const scale = targetW / Math.max(1, img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          try{
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            let lumSum = 0;
            for(let i = 0; i < d.length; i += 4){
              lumSum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            }
            const avgLum = lumSum / Math.max(1, d.length / 4);
            const isDarkBg = avgLum < 115;
            for(let i = 0; i < d.length; i += 4){
              let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              if(isDarkBg) g = 255 - g;
              g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
              d[i] = d[i + 1] = d[i + 2] = g;
            }
            ctx.putImageData(imgData, 0, 0);
          }catch(e){}
          resolve(c);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function detectTwoColumnSplit(canvas){
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    const yStart = Math.floor(h * 0.08);
    const yEnd = Math.floor(h * 0.86);
    const sampleH = Math.max(1, yEnd - yStart);
    const imgData = ctx.getImageData(0, yStart, w, sampleH).data;
    const colDark = new Float32Array(w);
    for(let y = 0; y < sampleH; y += 2){
      const rowOff = y * w * 4;
      for(let x = 0; x < w; x++){
        if(imgData[rowOff + x * 4] < 165) colDark[x]++;
      }
    }
    const rowsSampled = Math.max(1, Math.ceil(sampleH / 2));
    const searchStart = Math.floor(w * 0.36);
    const searchEnd = Math.floor(w * 0.64);
    const minGutterW = Math.max(14, Math.floor(w * 0.022));

    let bestStart = -1, bestLen = 0, runStart = -1, runLen = 0;
    for(let x = searchStart; x <= searchEnd; x++){
      const density = colDark[x] / rowsSampled;
      if(density < 0.014){
        if(runStart < 0) runStart = x;
        runLen++;
        if(runLen > bestLen){ bestLen = runLen; bestStart = runStart; }
      } else {
        runStart = -1;
        runLen = 0;
      }
    }
    if(bestLen < minGutterW) return null;
    const splitX = bestStart + Math.floor(bestLen / 2);

    // Confirm both left and right halves actually contain text ink
    let leftInk = 0, rightInk = 0;
    for(let x = Math.floor(w * 0.06); x < splitX - 8; x++) leftInk += colDark[x];
    for(let x = splitX + 8; x < Math.floor(w * 0.94); x++) rightInk += colDark[x];
    if(leftInk < rowsSampled * 0.35 || rightInk < rowsSampled * 0.35) return null;
    return splitX;
  }

  function cropCanvasRegion(src, sx, sw){
    const c = document.createElement('canvas');
    c.width = sw;
    c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sw, src.height);
    ctx.drawImage(src, sx, 0, sw, src.height, 0, 0, sw, src.height);
    return c.toDataURL('image/png');
  }

  function cleanOcrText(raw){
    return String(raw || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map(l => l.replace(/[ \t]+$/g, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function escHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeFilename(title, ext){
    const base = String(title || 'song')
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 70) || 'song';
    return `${base}.${ext}`;
  }

  // (2026-07-13) native APK Downloads save + push notification; prev: browser link only
  function blobToBase64(blob){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onerror = reject;
      r.onload = ()=>{
        const str = String(r.result || '');
        const idx = str.indexOf(',');
        resolve(idx >= 0 ? str.slice(idx + 1) : str);
      };
      r.readAsDataURL(blob);
    });
  }

  async function triggerBlobDownload(blob, filename){
    try{
      const cap = typeof window !== 'undefined' ? window.Capacitor : null;
      const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
      const plugin = cap && ((cap.Plugins && cap.Plugins.GoogleOneTap) || (typeof cap.registerPlugin === 'function' ? cap.registerPlugin('GoogleOneTap') : null));
      if(isNative && plugin && typeof plugin.saveFileToDownloads === 'function'){
        const base64Data = await blobToBase64(blob);
        const res = await plugin.saveFileToDownloads({
          filename,
          mimeType: blob.type || 'application/octet-stream',
          base64Data
        });
        const dir = (res && res.directory) || 'Downloads/ChoirBookPro';
        if(typeof window.showToast === 'function') window.showToast(`Saved to ${dir}/${filename}`);
        return;
      }
    }catch(e){}
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      a.remove();
      URL.revokeObjectURL(url);
    }, 1500);
  }

  /* ---------------- 1. IMAGE-TO-LYRICS OCR SCANNER MODAL ---------------- */
  window.openLyricsImageScanner = function openLyricsImageScanner(targetTextarea, onApply){
    const existing = document.getElementById('ocr-scanner-backdrop');
    if(existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'ocr-scanner-backdrop';
    backdrop.className = 'modal-backdrop center';
    backdrop.style.zIndex = '10020';
    backdrop.innerHTML = `
      <div class="modal card ocr-scanner-modal" style="max-width:460px;width:92vw;max-height:88vh;display:flex;flex-direction:column;gap:12px;">
        <button type="button" class="icon-btn modal-close" id="ocr-close-btn" title="Close">&times;</button>
        <div style="padding-right:28px;">
          <h3 style="margin:0;font-size:17px;font-weight:800;">Upload Img Lyrics</h3>
          <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">Upload 1 or more lyric photos or screenshots to extract copyable text.</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="file" id="ocr-file-input" accept="image/*" multiple style="display:none;"/>
          <button type="button" class="btn btn-primary" id="ocr-pick-btn" style="flex:1;min-height:42px;font-weight:800;font-size:13.5px;">Choose Image(s)</button>
        </div>
        <!-- (2026-07-13) Auto / 1-Col / 2-Col layout selector for OCR; prev: single pass -->
        <div class="display-mode-segmented" id="ocr-col-mode-group" style="margin-top:-4px;">
          <button type="button" class="display-mode-btn is-active" data-col-mode="auto">Auto Cols</button>
          <button type="button" class="display-mode-btn" data-col-mode="1">1 Column</button>
          <button type="button" class="display-mode-btn" data-col-mode="2">2 Columns</button>
        </div>
        <div id="ocr-progress-wrap" style="display:none;flex-direction:column;gap:6px;">
          <div id="ocr-status-text" style="font-size:12px;font-weight:700;color:var(--accent);">Preparing scanner…</div>
          <div style="height:6px;background:var(--bg-elev2);border-radius:999px;overflow:hidden;">
            <div id="ocr-progress-bar" style="height:100%;width:0%;background:var(--accent);"></div>
          </div>
        </div>
        <textarea id="ocr-result-textarea" placeholder="Extracted lyrics will appear here — you can edit, copy, or insert directly into the song…" style="width:100%;min-height:220px;flex:1;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.45;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg-elev2);color:var(--text);box-sizing:border-box;"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" id="ocr-copy-btn" style="flex:1;min-height:38px;font-size:12.5px;font-weight:700;">Copy Text</button>
          <button type="button" class="btn btn-secondary" id="ocr-append-btn" style="flex:1;min-height:38px;font-size:12.5px;font-weight:700;">Append to Song</button>
          <button type="button" class="btn btn-primary" id="ocr-replace-btn" style="flex:1;min-height:38px;font-size:12.5px;font-weight:800;">Use as Lyrics</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const fileInput = backdrop.querySelector('#ocr-file-input');
    const pickBtn = backdrop.querySelector('#ocr-pick-btn');
    const closeBtn = backdrop.querySelector('#ocr-close-btn');
    const progWrap = backdrop.querySelector('#ocr-progress-wrap');
    const statusEl = backdrop.querySelector('#ocr-status-text');
    const progBar = backdrop.querySelector('#ocr-progress-bar');
    const resultEl = backdrop.querySelector('#ocr-result-textarea');
    const copyBtn = backdrop.querySelector('#ocr-copy-btn');
    const appendBtn = backdrop.querySelector('#ocr-append-btn');
    const replaceBtn = backdrop.querySelector('#ocr-replace-btn');

    const closeModal = ()=> backdrop.remove();
    closeBtn.onclick = closeModal;
    backdrop.onclick = (e)=>{ if(e.target === backdrop) closeModal(); };
    pickBtn.onclick = ()=> fileInput.click();

    let ocrColMode = 'auto';
    const colModeGroup = backdrop.querySelector('#ocr-col-mode-group');
    if(colModeGroup){
      colModeGroup.querySelectorAll('.display-mode-btn').forEach(btn => {
        btn.onclick = ()=>{
          ocrColMode = btn.dataset.colMode || 'auto';
          colModeGroup.querySelectorAll('.display-mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
        };
      });
    }

    fileInput.onchange = async ()=>{
      const files = Array.from(fileInput.files || []);
      if(files.length === 0) return;
      progWrap.style.display = 'flex';
      pickBtn.disabled = true;
      statusEl.textContent = 'Loading OCR engine…';
      progBar.style.width = '8%';
      try{
        const Tesseract = await loadTesseract();
        const extractedParts = [];
        for(let i = 0; i < files.length; i++){
          statusEl.textContent = `Analyzing image ${i + 1} of ${files.length}…`;
          const canvas = await preprocessImageToCanvas(files[i]);
          let splitX = null;
          if(ocrColMode === '2'){
            splitX = detectTwoColumnSplit(canvas) || Math.floor(canvas.width / 2);
          } else if(ocrColMode === 'auto'){
            splitX = detectTwoColumnSplit(canvas);
          }
          const regions = splitX
            ? [
                { label: 'Col 1', url: cropCanvasRegion(canvas, 0, splitX) },
                { label: 'Col 2', url: cropCanvasRegion(canvas, splitX, canvas.width - splitX) }
              ]
            : [{ label: '', url: canvas.toDataURL('image/png') }];

          const colTexts = [];
          for(let r = 0; r < regions.length; r++){
            const reg = regions[r];
            const res = await Tesseract.recognize(reg.url, 'eng', {
              logger: m => {
                if(m && typeof m.progress === 'number'){
                  const stepFrac = (r + m.progress) / regions.length;
                  const overall = ((i + stepFrac) / files.length) * 100;
                  progBar.style.width = `${Math.max(8, Math.round(overall))}%`;
                  const colTag = reg.label ? ` (${reg.label})` : '';
                  statusEl.textContent = `Scanning image ${i + 1}/${files.length}${colTag} — ${Math.round(m.progress * 100)}%…`;
                }
              }
            });
            const cleaned = cleanOcrText(res && res.data && res.data.text);
            if(cleaned) colTexts.push(cleaned);
          }
          if(colTexts.length > 0) extractedParts.push(colTexts.join('\n\n'));
        }
        const combined = extractedParts.join('\n\n');
        resultEl.value = resultEl.value.trim() ? (resultEl.value.trim() + '\n\n' + combined) : combined;
        progBar.style.width = '100%';
        statusEl.textContent = combined ? `Done — extracted from ${files.length} image(s).` : 'No readable text found in image.';
      }catch(err){
        statusEl.textContent = 'Scan failed: ' + (err && err.message ? err.message : 'Unknown error');
      }finally{
        pickBtn.disabled = false;
        fileInput.value = '';
      }
    };

    copyBtn.onclick = async ()=>{
      const txt = resultEl.value.trim();
      if(!txt) return;
      try{
        await navigator.clipboard.writeText(txt);
        if(typeof window.showToast === 'function') window.showToast('Copied lyrics to clipboard');
      }catch(e){
        resultEl.select();
        document.execCommand('copy');
        if(typeof window.showToast === 'function') window.showToast('Copied lyrics to clipboard');
      }
    };

    const applyText = (mode)=>{
      const txt = resultEl.value.trim();
      if(!txt) return;
      if(targetTextarea){
        if(mode === 'append' && targetTextarea.value.trim()){
          targetTextarea.value = targetTextarea.value.replace(/\s+$/, '') + '\n\n' + txt;
        } else {
          targetTextarea.value = txt;
        }
        targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if(typeof onApply === 'function') onApply(txt, mode);
      closeModal();
    };
    appendBtn.onclick = ()=> applyText('append');
    replaceBtn.onclick = ()=> applyText('replace');
  };

  /* ---------------- 2. CLEAN LYRICS-ONLY PARSER FOR EXPORT ---------------- */
  // (2026-07-13) standalone lyrics-only parser starting at first Verse/Chorus; prev: leaked chords
  const EXPORT_CHORD_TOK_RE = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:\/[A-G][#b]?)?$/;
  const EXPORT_NOTE_TOK_RE = /^[a-g][#b]?[0-9]?$/;
  const EXPORT_LYRIC_SECTION_RE = /^(?:Verse|Chorus|Cho|Koro|Kuro|Coro|Refrain|Ref|Bridge|Pre-?Chorus|Post-?Chorus|Ending|Coda|Tag|Finale|Stanza|Estropa|Berso|Tugon|Tubag|Antiphon|Antipona|Himaya)[\s.:\-0-9IVX]*$/i;
  const EXPORT_ROMAN_OR_NUM_RE = /^(?:(?:I|II|III|IV|V|VI|VII|VIII|IX|X)[.:\)]?|\d{1,2}[.:\)]|[VCB]\d{1,2}[.:\)]?)$/;
  const EXPORT_SKIP_SECTION_RE = /^(?:Intro|Introduction|Interlude|Instrumental|Outro)[\s.:\-0-9IVX]*$/i;
  const EXPORT_META_LINE_RE = /^(?:music\b|tempo\b|transpose\b|capo\b|key\b|style\b|voice\b|dual\s*voice\b|acmp\b|entrance\s*:|offertory\s*:|communion\s*:|recessional\s*:|kyrie\s*:|gloria\s*:|sanctus\s*:)/i;

  function isExportChordOrMelodyLine(raw){
    const s = String(raw || '').trim();
    if(!s) return false;
    if(s.startsWith('>') || s.startsWith('<')) return true;
    if(/^[=\-_]{4,}$/.test(s)) return true;
    const toks = s.replace(/[()\[\],\-|]/g, ' ').split(/\s+/).filter(Boolean);
    if(toks.length === 0) return true;
    const chordHits = toks.filter(t => EXPORT_CHORD_TOK_RE.test(t) || t === 'N.C.' || t === '%').length;
    if(chordHits / toks.length >= 0.7) return true;
    const noteHits = toks.filter(t => EXPORT_NOTE_TOK_RE.test(t)).length;
    if(toks.length >= 3 && noteHits / toks.length >= 0.75) return true;
    return false;
  }

  function isExportLyricSectionHeader(raw){
    const s = String(raw || '').trim().replace(/^[\[\(]|[\]\)]$/g, '').trim();
    if(!s) return false;
    return EXPORT_LYRIC_SECTION_RE.test(s) || EXPORT_ROMAN_OR_NUM_RE.test(s);
  }

  function buildExportBlocks(song){
    const body = (song && song.body) || '';
    const rawLines = body.split(/\r?\n/);

    // Start at the first real Verse / Chorus / Koro / Roman numeral section if present
    let startIdx = 0;
    for(let i = 0; i < rawLines.length; i++){
      if(isExportLyricSectionHeader(rawLines[i])){
        startIdx = i;
        break;
      }
    }

    const blocks = [];
    for(let i = startIdx; i < rawLines.length; i++){
      const line = rawLines[i];
      const trimmed = line.trim();
      if(!trimmed){
        if(blocks.length > 0 && blocks[blocks.length - 1].type !== 'blank'){
          blocks.push({ type: 'blank', lines: [] });
        }
        continue;
      }
      if(isExportChordOrMelodyLine(trimmed)) continue;
      const unwrapped = trimmed.replace(/^[\[\(]|[\]\)]$/g, '').trim();
      if(EXPORT_SKIP_SECTION_RE.test(unwrapped)) continue;
      if(EXPORT_META_LINE_RE.test(unwrapped)) continue;
      if(isExportLyricSectionHeader(trimmed)){
        blocks.push({ type: 'section', lines: [unwrapped.replace(/:+\s*$/, '')] });
        continue;
      }
      const clean = trimmed.replace(/<[^>]+>/g, '').trim();
      if(clean) blocks.push({ type: 'lyric', lines: [clean] });
    }
    while(blocks.length > 0 && blocks[blocks.length - 1].type === 'blank') blocks.pop();
    return blocks;
  }

  /* ---------------- 3. PNG EXPORT (WHITE BG, BLACK TEXT, AUTO 2-COL) ---------------- */
  function wrapTextToWidth(ctx, text, maxW, preserveSpacing){
    if(!text) return [''];
    if(ctx.measureText(text).width <= maxW) return [text];
    if(preserveSpacing){
      return [text];
    }
    const words = text.split(/\s+/);
    const out = [];
    let cur = '';
    for(const w of words){
      const test = cur ? (cur + ' ' + w) : w;
      if(ctx.measureText(test).width <= maxW || !cur){
        cur = test;
      } else {
        out.push(cur);
        cur = w;
      }
    }
    if(cur) out.push(cur);
    return out;
  }

  function layoutBlocksForColumn(ctx, blocks, colW, fontSize, useMono){
    const lyricFont = useMono
      ? `600 ${fontSize}px "JetBrains Mono", Consolas, monospace`
      : `600 ${fontSize}px "Montserrat", "Manrope", Arial, sans-serif`;
    const chordFont = `800 ${Math.round(fontSize * 0.88)}px "JetBrains Mono", Consolas, monospace`;
    const sectionFont = `800 ${Math.round(fontSize * 0.92)}px "Montserrat", "Manrope", Arial, sans-serif`;
    const lineH = Math.round(fontSize * 1.38);
    const chordH = Math.round(fontSize * 1.18);
    const blankH = Math.round(fontSize * 0.75);
    const items = [];

    for(const b of blocks){
      if(b.type === 'blank'){
        items.push({ kind: 'blank', h: blankH });
      } else if(b.type === 'section'){
        ctx.font = sectionFont;
        const wrapped = wrapTextToWidth(ctx, b.lines[0].toUpperCase(), colW, false);
        items.push({ kind: 'section', lines: wrapped, font: sectionFont, lineH, h: Math.round(fontSize * 0.45) + wrapped.length * lineH });
      } else if(b.type === 'chord_lyric'){
        ctx.font = lyricFont;
        const lWrapped = wrapTextToWidth(ctx, b.lyric, colW, useMono);
        items.push({
          kind: 'chord_lyric',
          chord: b.chord,
          chordFont,
          chordH,
          lines: lWrapped,
          font: lyricFont,
          lineH,
          h: chordH + lWrapped.length * lineH + Math.round(fontSize * 0.14)
        });
      } else if(b.type === 'chord'){
        items.push({ kind: 'chord', lines: b.lines, font: chordFont, lineH: chordH, h: chordH });
      } else {
        ctx.font = lyricFont;
        const wrapped = wrapTextToWidth(ctx, b.lines[0], colW, false);
        items.push({ kind: 'lyric', lines: wrapped, font: lyricFont, lineH, h: wrapped.length * lineH });
      }
    }
    return items;
  }

  function splitIntoTwoColumns(items){
    const totalH = items.reduce((a, it) => a + it.h, 0);
    const halfH = totalH / 2;
    let bestSplit = Math.ceil(items.length / 2);
    let bestDiff = Infinity;
    let acc = 0;
    for(let i = 0; i < items.length - 1; i++){
      acc += items[i].h;
      // Avoid leaving a section header orphaned at the bottom of column 1
      if(items[i].kind === 'section') continue;
      const diff = Math.abs(acc - halfH);
      if(diff < bestDiff){
        bestDiff = diff;
        bestSplit = i + 1;
      }
    }
    const col1 = items.slice(0, bestSplit);
    const col2 = items.slice(bestSplit);
    while(col2.length > 0 && col2[0].kind === 'blank') col2.shift();
    const h1 = col1.reduce((a, it) => a + it.h, 0);
    const h2 = col2.reduce((a, it) => a + it.h, 0);
    return { col1, col2, maxColH: Math.max(h1, h2) };
  }

  window.exportSongAsPng = function exportSongAsPng(song, options){
    if(!song) return;
    const lyricsOnly = !!(options && options.lyricsOnly);
    const blocks = buildExportBlocks(song, lyricsOnly);
    const hasChords = !lyricsOnly && blocks.some(b => b.type === 'chord' || b.type === 'chord_lyric');
    const title = (typeof window.cleanSongTitleForDisplay === 'function' ? window.cleanSongTitleForDisplay(song.title) : song.title) || 'Untitled Song';
    const metaParts = [];
    if(song.artist) metaParts.push(song.artist);
    const effKey = (typeof window.getEffectiveSongKey === 'function' ? window.getEffectiveSongKey(song) : song.key) || '';
    if(effKey && !lyricsOnly) metaParts.push('Key: ' + effKey);
    const subtitle = metaParts.join('  •  ');

    // Crisp A4-ratio high-res canvas (1654 x 2339)
    const W = 1654;
    const H = 2339;
    const marginX = 84;
    const marginTop = 86;
    const marginBottom = 78;
    const headerH = subtitle ? 132 : 96;
    const bodyTop = marginTop + headerH;
    const availH = H - bodyTop - marginBottom;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Measure 1-column vs 2-column fit
    const singleColW = W - marginX * 2;
    const twoColGap = 68;
    const twoColW = Math.floor((W - marginX * 2 - twoColGap) / 2);

    const trySingleCol = (fs)=>{
      const items = layoutBlocksForColumn(ctx, blocks, singleColW, fs, hasChords);
      const totalH = items.reduce((a, it) => a + it.h, 0);
      return { fits: totalH <= availH, items, totalH };
    };
    const tryTwoCols = (fs)=>{
      const items = layoutBlocksForColumn(ctx, blocks, twoColW, fs, hasChords);
      const split = splitIntoTwoColumns(items);
      return { fits: split.maxColH <= availH, split };
    };

    // Prefer 1 column if readable (>= 30px) fits on page; otherwise auto 2 columns filling the sheet
    let useTwoCols = false;
    let chosenFs = 34;
    let chosenSingle = null;
    let chosenSplit = null;

    const minSingleFs = 30;
    if(trySingleCol(minSingleFs).fits){
      let lo = minSingleFs, hi = 46, best = minSingleFs;
      while(lo <= hi){
        const mid = (lo + hi) >> 1;
        if(trySingleCol(mid).fits){ best = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      chosenFs = best;
      chosenSingle = trySingleCol(chosenFs).items;
    } else {
      useTwoCols = true;
      let lo = 16, hi = 36, best = 16;
      while(lo <= hi){
        const mid = (lo + hi) >> 1;
        if(tryTwoCols(mid).fits){ best = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      chosenFs = best;
      chosenSplit = tryTwoCols(chosenFs).split;
      // If extremely long song still overflows at 16px, expand canvas height cleanly so nothing clips
      if(chosenSplit.maxColH > availH){
        canvas.height = bodyTop + chosenSplit.maxColH + marginBottom;
      }
    }

    // Paint pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.font = '900 46px "Montserrat", "Manrope", Arial, sans-serif';
    ctx.fillText(title.toUpperCase(), marginX, marginTop, singleColW);
    if(subtitle){
      ctx.fillStyle = '#444444';
      ctx.font = '600 24px "Manrope", Arial, sans-serif';
      ctx.fillText(subtitle, marginX, marginTop + 60, singleColW);
    }
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, bodyTop - 22);
    ctx.lineTo(W - marginX, bodyTop - 22);
    ctx.stroke();

    const drawColumn = (items, startX)=>{
      let y = bodyTop;
      for(const it of items){
        if(it.kind === 'blank'){
          y += it.h;
        } else if(it.kind === 'section'){
          y += Math.round(chosenFs * 0.45);
          ctx.fillStyle = '#000000';
          ctx.font = it.font;
          for(const ln of it.lines){
            ctx.fillText(ln, startX, y);
            y += it.lineH;
          }
        } else if(it.kind === 'chord_lyric'){
          ctx.fillStyle = '#1d4ed8';
          ctx.font = it.chordFont;
          ctx.fillText(it.chord, startX, y);
          y += it.chordH;
          ctx.fillStyle = '#000000';
          ctx.font = it.font;
          for(const ln of it.lines){
            ctx.fillText(ln, startX, y);
            y += it.lineH;
          }
          y += Math.round(chosenFs * 0.14);
        } else if(it.kind === 'chord'){
          ctx.fillStyle = '#1d4ed8';
          ctx.font = it.font;
          for(const ln of it.lines){
            ctx.fillText(ln, startX, y);
            y += it.lineH;
          }
        } else {
          ctx.fillStyle = '#000000';
          ctx.font = it.font;
          for(const ln of it.lines){
            ctx.fillText(ln, startX, y);
            y += it.lineH;
          }
        }
      }
    };

    if(!useTwoCols){
      drawColumn(chosenSingle, marginX);
    } else {
      drawColumn(chosenSplit.col1, marginX);
      const midX = marginX + twoColW + Math.floor(twoColGap / 2);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, bodyTop);
      ctx.lineTo(midX, Math.min(canvas.height - marginBottom, bodyTop + chosenSplit.maxColH));
      ctx.stroke();
      drawColumn(chosenSplit.col2, marginX + twoColW + twoColGap);
    }

    const fname = safeFilename(title + (lyricsOnly ? ' (Lyrics)' : ''), 'png');
    if(canvas.toBlob){
      canvas.toBlob(blob => {
        if(blob){
          triggerBlobDownload(blob, fname);
          if(typeof window.showToast === 'function') window.showToast('Downloaded ' + fname);
        }
      }, 'image/png');
    } else {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = fname;
      a.click();
    }
  };

  /* ---------------- 4. PRINTABLE PDF & WORD (.DOC) EXPORT ---------------- */
  function buildPrintableSongHtml(song, lyricsOnly, forWord){
    const blocks = buildExportBlocks(song, lyricsOnly);
    const hasChords = !lyricsOnly && blocks.some(b => b.type === 'chord' || b.type === 'chord_lyric');
    const title = (typeof window.cleanSongTitleForDisplay === 'function' ? window.cleanSongTitleForDisplay(song.title) : song.title) || 'Untitled Song';
    const metaParts = [];
    if(song.artist) metaParts.push(song.artist);
    const effKey = (typeof window.getEffectiveSongKey === 'function' ? window.getEffectiveSongKey(song) : song.key) || '';
    if(effKey && !lyricsOnly) metaParts.push('Key: ' + effKey);
    const subtitle = metaParts.join('  •  ');
    const useTwoCols = blocks.length > 26;

    const bodyHtml = blocks.map(b => {
      if(b.type === 'blank') return `<div class="sp">&nbsp;</div>`;
      if(b.type === 'section') return `<div class="sec">${escHtml(b.lines[0].toUpperCase())}</div>`;
      if(b.type === 'chord_lyric'){
        return `<div class="pair"><div class="ch">${escHtml(b.chord)}</div><div class="ly">${escHtml(b.lyric)}</div></div>`;
      }
      if(b.type === 'chord') return `<div class="ch">${escHtml(b.lines[0])}</div>`;
      return `<div class="ly">${escHtml(b.lines[0])}</div>`;
    }).join('');

    const fontFamily = hasChords ? "'Consolas','Courier New',monospace" : "'Segoe UI',Arial,sans-serif";
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>${escHtml(title)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { background:#ffffff; color:#000000; font-family:${fontFamily}; margin:0; padding:${forWord ? '0' : '18px 24px'}; }
  .hdr { border-bottom:2px solid #d4d4d8; padding-bottom:8px; margin-bottom:14px; }
  .ttl { font-family:'Segoe UI',Arial,sans-serif; font-size:22pt; font-weight:900; margin:0; color:#000000; text-transform:uppercase; }
  .sub { font-family:'Segoe UI',Arial,sans-serif; font-size:10.5pt; color:#444444; margin-top:4px; }
  .cols { ${useTwoCols ? 'column-count:2; column-gap:26px; column-rule:1px solid #e5e7eb;' : ''} font-size:${useTwoCols ? '10.5pt' : '12.5pt'}; line-height:1.4; }
  .sec { font-family:'Segoe UI',Arial,sans-serif; font-weight:800; font-size:10.5pt; margin-top:10px; margin-bottom:3px; color:#000000; break-after:avoid; page-break-after:avoid; }
  .pair { break-inside:avoid; page-break-inside:avoid; margin-bottom:3px; }
  .ch { font-family:'Consolas','Courier New',monospace; font-weight:800; color:#1d4ed8; white-space:pre-wrap; line-height:1.15; }
  .ly { color:#000000; font-weight:600; white-space:${hasChords ? 'pre-wrap' : 'normal'}; }
  .sp { height:8px; }
</style>
</head>
<body>
  <div class="hdr">
    <h1 class="ttl">${escHtml(title)}</h1>
    ${subtitle ? `<div class="sub">${escHtml(subtitle)}</div>` : ''}
  </div>
  <div class="cols">${bodyHtml}</div>
</body>
</html>`;
  }

  window.exportSongAsPdf = function exportSongAsPdf(song, options){
    if(!song) return;
    const html = buildPrintableSongHtml(song, true, false);
    // (2026-07-13) save printable sheet to Downloads with notification on APK; prev: iframe print only
    const cap = typeof window !== 'undefined' ? window.Capacitor : null;
    if(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()){
      const title = (typeof window.cleanSongTitleForDisplay === 'function' ? window.cleanSongTitleForDisplay(song.title) : song.title) || 'Untitled Song';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      triggerBlobDownload(blob, safeFilename(title + ' (Printable)', 'html'));
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if(!doc){ iframe.remove(); return; }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(()=>{
      try{
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }catch(e){}
      setTimeout(()=> iframe.remove(), 2500);
    }, 250);
  };

  window.exportSongAsWord = function exportSongAsWord(song, options){
    if(!song) return;
    const lyricsOnly = !!(options && options.lyricsOnly);
    const title = (typeof window.cleanSongTitleForDisplay === 'function' ? window.cleanSongTitleForDisplay(song.title) : song.title) || 'Untitled Song';
    const html = buildPrintableSongHtml(song, lyricsOnly, true);
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const fname = safeFilename(title + (lyricsOnly ? ' (Lyrics)' : ''), 'doc');
    triggerBlobDownload(blob, fname);
    if(typeof window.showToast === 'function') window.showToast('Downloaded ' + fname);
  };
})();
