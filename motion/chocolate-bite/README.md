# Chocolate Bite – motion graphics (16:9, 1920×1080, 14s)

- `index.html` – the animation. Open it in a browser to preview (Play / scrub / "Load narration" to sync with an audio file).
- `render.js` – renders the MP4 frame by frame: `node render.js [narration.wav] [out.mp4]`
  (if `narration.wav` sits next to the script it is muxed in automatically).
- Sync markers (`const M` at the top of the script) – times in seconds for "בום!", "לוּפִּים", "נגיסה" etc.; every keyword lands on the animation's peak frame.
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for every transition.
