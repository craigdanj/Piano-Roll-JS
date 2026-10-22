# Piano Roll JS

A dependency-free, embeddable piano roll extracted from Ambient Pad JS. MIT licensed. Includes the original editing, navigation, chord and harmony capabilities, without depending on the Ambient Pad synthesizer.

Open **demo.html** in a modern browser to try it. No install, build step, CDN, or server is needed. Click Play to enable browser audio. `demo-instruments.js` supplies lightweight example instruments; it is deliberately separate from the editor.

## Embed

```html
<div id="notes"></div>
<script src="piano-roll.js"></script>
<script>
const roll = new PianoRoll('#notes', {
  bars: 8,
  notes: [{ midi: 60, start: 0, length: 2, velocity: 0.8 }],
  onChange(project) { console.log(project); },
  onNote({ midi, time, duration, velocity, context }) {
    // Schedule your instrument at `time` in this AudioContext.
    // Duration is seconds; MIDI is an integer and velocity is 0.1–1.
  },
  onStop() {
    // Cancel ALL your scheduled and sounding voices, including future notes.
  }
});
</script>
```

Each editor uses its own shadow root, state, history and clipboard. Styles and IDs stay inside the container. Shortcuts only run when focus is inside that editor. There is no automatic localStorage write. Save/Open downloads and reads JSON; host applications may persist `onChange` themselves. Do not synchronously call a mutating API from `onChange`.

The single `piano-roll.js` file includes its styles, UI and pure editing/navigation/harmony helpers. No external stylesheet is required. Source is unminified; helpers precede the per-instance editor implementation.

## Editing and navigation

- Select, draw, erase; right-click or double-click to delete.
- Shift-click selection, additive marquee selection, group movement and right-edge group resizing.
- Snap settings, Alt-drag to bypass snap, note length and group velocity.
- Select all, cut/copy/paste at the insert cursor, duplicate, delete, transpose all.
- Undo/redo (100 edits), Escape/blur/pointer-cancel rollback for drags.
- Horizontal/vertical zoom, pointer-anchored wheel zoom, fit clip/selection, scrolling, pinned ruler/keyboard.
- Seek, pause/resume, loop range handles and loop selection, draggable clip end, playhead follow, metronome.
- Chord insertion/editing, transitions, scale highlighting, diatonic suggestions, automatic voice leading and transposition.
- JSON project import/export, including original Ambient Pad JS version-1 projects. Synth parameters from those projects are ignored.

| Shortcut | Action |
|---|---|
| V / B / E | Select / Draw / Erase |
| Ctrl/Cmd+A | Select all |
| Ctrl/Cmd+C / X / V / D | Copy / Cut / Paste / Duplicate |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z or Ctrl+Y | Redo |
| Arrows | Move one snap step or semitone |
| Shift+arrows | Move one bar or octave |
| Delete / Backspace | Delete selected |
| Escape | Cancel drag or clear selection |
| Space | Pause/resume |
| Home / End | Seek to start/end of playback range |
| F / Shift+F | Fit clip / selection |
| + / − | Horizontal zoom |
| Ctrl/Cmd+wheel / Alt+wheel | Time / pitch zoom |
| Shift+wheel | Horizontal scroll |
| Click / Shift-click ruler | Seek / set paste cursor |

## API

Constructor: `new PianoRoll(elementOrSelector, options)`.

Options: `instrument` (see below), `project` (full project), `notes` (initial notes), `bars` (1–128, default 8), `audioContext` (optional shared context), `onNote`, `onStop`, `onChange`. `project` takes priority over `notes`. Without a project or notes, the editor starts blank.

| Method | Behavior |
|---|---|
| `getProject()` / `getNotes()` | Return detached data copies |
| `setProject(project)` | Validate and load a project, undoable; stops playback |
| `setNotes(notes)` | Replace notes and clear chord cards, undoable |
| `play()` | Begin/resume playback (Promise); user gesture required for audio |
| `pause()` / `stop()` | Pause in place / return to playback-range start |
| `seek(beat)` | Seek using zero-based quarter-note beats |
| `setLoop(start, end)` | Set and enable loop, exclusive end; clamped to clip |
| `undo()` / `redo()` | Restore arrangement edits |
| `fit()` | Fit the clip horizontally |
| `destroy()` | Stop, detach listeners, cancel timers and empty shadow root |

Also emits `pianoroll:change` (project in `detail`), `pianoroll:note` (scheduled note payload), and `pianoroll:stop` on the container. Keep a reference to the instance. A destroyed container retains its empty shadow root; mount a new instance on a fresh container.

## Data and audio contract

Note: `{ id?, midi, start, length, velocity }`. `start` and `length` are quarter-note beats, starting at zero. Imported IDs are regenerated. Pitch range is **MIDI 36–84 (C2–C6)**, velocity 0.1–1, maximum 512 notes, 1–128 bars in 4/4, tempo 35–180 BPM. Notes may overlap the clip end by up to two beats for chord transitions. These limits are inherited from the original editor.

`getProject()` supplies all required project fields (`version: 1`, `bars`, `bpm`, `notes`) plus chords, loop, scale and viewport state. Use it as a base for `setProject`. Import validation throws before changing state. Shortening the clip removes notes starting beyond the new end and truncates others; Undo restores them.

The editor schedules events roughly 120 ms ahead against Web Audio's clock. `time` is an absolute AudioContext time; schedule immediately on receipt, rather than using another JavaScript timer. The editor does not produce instrument audio itself. The metronome is internal. Pass a shared `audioContext` when integrating an existing instrument; the editor closes only contexts it owns. `onStop` must cancel queued voices as well as currently sounding voices. Committed edits during playback reschedule from the current position and retrigger held notes. Backgrounding the document pauses playback. WAV rendering belongs to the host instrument and is not part of this editor package.

## Files

- `piano-roll.js`: reusable plugin with embedded UI/CSS.
- `demo.html`, `demo.js`: runnable example and replaceable sound adapter.
- `tests/`: editing/navigation and DOM-harness API regression tests.
- `LICENSE`: MIT, Craig Johnson.

## Verification

Run `node tests/regression.cjs`. Covers the bundled helpers and DOM-harness API behavior, including import rejection, undo/redo, isolation and cleanup. Real-browser visual and audible testing could not be completed in the build environment because Chromium installation failed.

## Pluggable instruments (v1.1)

Pass `instrument` to the constructor, or call `roll.setInstrument(adapter)` to switch. `roll.getInstrument()` returns the current adapter. Switching pauses the transport and cancels the previous instrument's scheduled voices; call `play()` to resume. Pass `null` to return to the legacy `onNote`/`onStop` callbacks. When an instrument is attached, those legacy callbacks are bypassed (DOM note/stop events still fire).

```js
const adapter = {
  async initialize({ context }) {
    // Optional: construct your instrument using this exact AudioContext,
    // load/decode samples, and await readiness. Runs once per attachment.
    // Keep initialization silent; do not start notes here.
  },
  scheduleNote({ midi, time, duration, velocity, context }) {
    // Required: schedule a voice immediately using absolute AudioContext time.
    // MIDI pitch: integer. Duration: seconds. Velocity: 0.1–1.
  },
  stop() {
    // Required: cancel both sounding voices AND future scheduled voices.
    // Must be synchronous, safe to repeat, and safe before initialization.
  }
};
const roll = new PianoRoll('#notes', { instrument: adapter });
// Later:
roll.setInstrument(anotherAdapter);
```

This interface supports synthesized instruments, sampled instruments and drum samplers that map MIDI pitches to sounds. Load samples in `initialize`, then use `AudioBufferSourceNode.start(time)` and a pitch ratio based on the sample's root MIDI note in `scheduleNote`. Track every source so `stop` can cancel notes already scheduled ahead of the playhead.

For Piano JS or another existing plugin, create a small wrapper that translates this contract to that plugin's actual note and stop methods. Supply its AudioContext via the `audioContext` option if it already owns one. Instrument APIs are not assumed to be identical: the package does not bundle Piano JS or claim automatic compatibility without a wrapper.

The host owns instrument resources and must dispose them when no longer needed. The editor invokes `stop` on switch/destroy, but never disposes externally owned instruments. Async initialization must only load/prepare resources, must tolerate a later stop, and must not start audio itself. A completed stale initialization cannot schedule editor notes after an instrument switch or destroy. Failed initialization may be retried by pressing Play.

`demo-instruments.js` contains independent soft-synth, organ-style and plucked-synth adapters. They demonstrate interchangeable instruments, not realistic acoustic emulations. `demo.js` connects the selected adapter to the piano roll.
