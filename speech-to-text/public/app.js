/* תמלול עברית - דיבור לטקסט
   משתמש ב-Web Speech API המובנה בדפדפן (ללא מפתח API). */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const micBtn      = $('micBtn');
  const micLabel    = $('micLabel');
  const statusBox   = $('status');
  const statusText  = $('statusText');
  const textArea    = $('text');
  const interimBox  = $('interim');
  const counter     = $('counter');
  const timerEl     = $('timer');
  const levelBar    = document.querySelector('#level span');
  const hint        = $('hint');
  const toast       = $('toast');

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------- בדיקת תמיכה ---------- */
  if (!SpeechRecognitionCtor) {
    $('unsupported').classList.remove('hidden');
    micBtn.disabled = true;
    micBtn.style.opacity = .4;
    micBtn.style.cursor = 'not-allowed';
    micLabel.textContent = 'לא נתמך בדפדפן זה';
    setStatus('הדפדפן אינו נתמך', false);
  }

  /* ---------- מצב ---------- */
  let recognition = null;
  let listening = false;      // המשתמש ביקש להקליט
  let startedAt = 0;
  let timerId = null;
  let restarts = [];          // חותמות זמן של הפעלות מחדש (הגנה מלולאה)
  let audioCtx = null, mediaStream = null, rafId = null;

  /* ---------- כלי עזר ---------- */
  function setStatus(text, live) {
    statusText.textContent = text;
    statusBox.classList.toggle('live', !!live);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function showHint(msg, isError = false) {
    if (!msg) { hint.classList.add('hidden'); return; }
    hint.textContent = msg;
    hint.classList.toggle('error', isError);
    hint.classList.remove('hidden');
  }

  function updateCounter() {
    const value = textArea.value.trim();
    const words = value ? value.split(/\s+/).length : 0;
    counter.textContent = `${words} מילים · ${textArea.value.length} תווים`;
  }

  function appendText(chunk) {
    const clean = chunk.trim();
    if (!clean) return;
    const current = textArea.value;
    const needsSpace = current.length > 0 && !/[\s\n]$/.test(current);
    textArea.value = current + (needsSpace ? ' ' : '') + clean;
    textArea.scrollTop = textArea.scrollHeight;
    updateCounter();
  }

  function insertAtCursor(str) {
    const start = textArea.selectionStart ?? textArea.value.length;
    const end = textArea.selectionEnd ?? textArea.value.length;
    textArea.value = textArea.value.slice(0, start) + str + textArea.value.slice(end);
    const pos = start + str.length;
    textArea.focus();
    textArea.setSelectionRange(pos, pos);
    updateCounter();
  }

  /* ---------- שעון ---------- */
  function startTimer() {
    startedAt = Date.now();
    timerEl.textContent = '00:00';
    timerId = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      timerEl.textContent =
        String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 500);
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  /* ---------- מד עוצמת קול (ויזואלי בלבד) ---------- */
  async function startMeter() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
        levelBar.style.width = Math.min(100, (peak / 60) * 100).toFixed(0) + '%';
        rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* המד הוויזואלי הוא בונוס - אם נכשל, התמלול ממשיך כרגיל */
    }
  }

  function stopMeter() {
    cancelAnimationFrame(rafId);
    rafId = null;
    levelBar.style.width = '0%';
    if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  }

  /* ---------- זיהוי דיבור ---------- */
  function createRecognition() {
    const rec = new SpeechRecognitionCtor();
    rec.lang = 'he-IL';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setStatus('מקליט… דברי בחופשיות', true);
      showHint('');
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) appendText(result[0].transcript);
        else interim += result[0].transcript;
      }
      interimBox.textContent = interim;
    };

    rec.onerror = (event) => {
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          stop();
          showHint('הגישה למיקרופון נחסמה. יש ללחוץ על סמל המנעול בשורת הכתובת ולאפשר מיקרופון, ואז לרענן את העמוד.', true);
          break;
        case 'audio-capture':
          stop();
          showHint('לא נמצא מיקרופון. יש לחבר מיקרופון ולנסות שוב.', true);
          break;
        case 'network':
          showHint('בעיית רשת — מנוע הזיהוי של הדפדפן דורש חיבור לאינטרנט.', true);
          break;
        case 'no-speech':
          /* שקט זמני - ממשיכים להאזין */
          break;
        case 'aborted':
          break;
        default:
          showHint('שגיאה בזיהוי: ' + event.error, true);
      }
    };

    rec.onend = () => {
      interimBox.textContent = '';
      if (!listening) return;

      // Chrome עוצר את הזיהוי מעצמו אחרי שקט — מפעילים מחדש כדי לאפשר הקלטה רציפה
      const now = Date.now();
      restarts = restarts.filter((t) => now - t < 10000);
      restarts.push(now);
      if (restarts.length > 12) {
        stop();
        showHint('הזיהוי נקטע שוב ושוב. כדאי לבדוק את חיבור האינטרנט ואת הרשאות המיקרופון, ואז לנסות שוב.', true);
        return;
      }
      try { rec.start(); } catch { /* כבר פועל */ }
    };

    return rec;
  }

  function start() {
    if (listening || !SpeechRecognitionCtor) return;
    listening = true;
    restarts = [];
    recognition = createRecognition();
    try {
      recognition.start();
    } catch {
      listening = false;
      showHint('לא ניתן היה להתחיל הקלטה. כדאי לרענן את העמוד ולנסות שוב.', true);
      return;
    }
    micBtn.classList.add('recording');
    micBtn.setAttribute('aria-label', 'עצור הקלטה');
    micLabel.textContent = 'לחצי כדי לעצור';
    setStatus('מתחבר למיקרופון…', true);
    startTimer();
    startMeter();
  }

  function stop() {
    if (!listening) return;
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
      recognition = null;
    }
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-label', 'התחל הקלטה');
    micLabel.textContent = 'לחצי כדי להתחיל לדבר';
    interimBox.textContent = '';
    setStatus('ההקלטה הופסקה', false);
    stopTimer();
    stopMeter();
  }

  /* ---------- אירועים ---------- */
  micBtn.addEventListener('click', () => (listening ? stop() : start()));

  document.querySelectorAll('.punct button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.insert;
      insertAtCursor(raw === '\\n' ? '\n' : raw);
    });
  });

  $('copyBtn').addEventListener('click', async () => {
    const value = textArea.value.trim();
    if (!value) { showToast('אין עדיין טקסט להעתקה'); return; }
    try {
      await navigator.clipboard.writeText(textArea.value);
    } catch {
      textArea.select();
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
    }
    const btn = $('copyBtn');
    const label = btn.querySelector('span');
    btn.classList.add('copied');
    label.textContent = 'הועתק!';
    showToast('✓ הטקסט הועתק ללוח');
    setTimeout(() => { btn.classList.remove('copied'); label.textContent = 'העתקה'; }, 1800);
  });

  $('downloadBtn').addEventListener('click', () => {
    const value = textArea.value.trim();
    if (!value) { showToast('אין עדיין טקסט להורדה'); return; }
    const stamp = new Date().toLocaleString('he-IL').replace(/[/:]/g, '-').replace(/,?\s+/g, '_');
    const blob = new Blob(['﻿' + textArea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `תמלול_${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ הקובץ הורד');
  });

  $('clearBtn').addEventListener('click', () => {
    if (!textArea.value) return;
    if (!confirm('לנקות את כל הטקסט?')) return;
    textArea.value = '';
    interimBox.textContent = '';
    updateCounter();
    textArea.focus();
  });

  textArea.addEventListener('input', updateCounter);

  // קיצורי מקלדת: Ctrl+M להקלטה, Ctrl+Shift+C להעתקה
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'm') { e.preventDefault(); micBtn.click(); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); $('copyBtn').click(); }
  });

  window.addEventListener('beforeunload', (e) => {
    if (textArea.value.trim()) { e.preventDefault(); e.returnValue = ''; }
  });

  updateCounter();
})();
