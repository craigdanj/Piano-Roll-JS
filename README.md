# Piano Roll JS — piano and drum editor

Embed `dist/piano-roll.js` in your page. The plugin includes its styles and UI in an isolated shadow root.

```html
<div id="editor"></div>
<script src="dist/piano-roll.js"></script>
<script>
const roll = new PianoRoll('#editor', {
  mode: 'drums',
  bars: 2,
  drumMap: [
    { midi: 36, name: 'Kick' },
    { midi: 38, name: 'Snare' },
    { midi: 42, name: 'Closed hi-hat' },
    { midi: 46, name: 'Open hi-hat' }
  ],
  instrument: myDrumAdapter
});
</script>
```

`mode` is `piano` (default) or `drums`. The default drum map has Kick, Snare, Clap, Closed hi-hat, Open hi-hat, Low tom, Crash, Ride. Supply your own ordered map with unique MIDI pitches 0–127 and plain-text names. Additional pitches in imported notes get fallback MIDI-number rows so notes are never hidden.

## Drum editing

Drums replace piano keys with instrument names. Click a name to audition; keyboard Enter/Space works on focused labels. Draw mode clicks add a hit, or remove an existing hit. Select mode supports multi-selection, marquee, drag to move, arrow keys, copy/cut/paste, duplicate, delete, undo/redo and group velocity. Up/down moves between visible rows (including nonadjacent MIDI pitches). Hit opacity shows velocity. Hits use short markers and have no resize handle; one-shot sound duration belongs to the instrument. Chord/scale controls are hidden in drum mode. Snap defaults to ¼ beat (sixteenth notes in 4/4). Timeline zoom, loop handles, clip length and transport remain available.

## Instrument contract

- `initialize({context})`: optional async preparation or sample loading.
- `scheduleNote({midi,time,duration,velocity,context})`: schedule immediately at the absolute AudioContext `time`. Drum adapters usually ignore duration and play one-shot sounds. Velocity is 0.1–1.
- `stop()`: synchronously cancel all sounding and scheduled voices. Safe to call repeatedly and before initialization.

Use `audioContext` to share an existing instrument's clock. `setInstrument(adapter)` pauses playback and stops the previous instrument. The host owns disposal. The demo kit in `dist/demo-instruments.js` is a small synthesized example, not Drum Synth JS; wrap your drum engine's actual API to connect it. No external samples are downloaded.

## API additions

- `setMode('drums' | 'piano', optionalDrumMap)` changes display mode without silently changing notes; throws if switching to piano with pitches outside C2–C6.
- `setDrumMap([{midi,name}, ...])` changes drum row labels/order.
- `getProject()` / `setProject(project)` include mode and drumMap for JSON persistence and undo history.
- Existing `getNotes`, `setNotes`, `play`, `pause`, `stop`, `seek`, `setLoop`, `fit`, `undo`, `redo`, `setInstrument`, `destroy` remain available.

The demo keeps separate piano/drum projects while toggling its Editor selector. Importing a project also updates the demo's instrument mode. Notes use `{midi,start,length,velocity}` with start/length in quarter-note beats; version 1 projects remain accepted. Maximum 512 notes, 128 bars, 4/4 time. One editor plays one instrument adapter at a time.

Open the hosted demo or serve `dist/` locally. Choose **Drums**, press Play for a two-bar starter beat, or use Empty clip to draw your own.

## Downloaded demo

Open `dist/index.html` in your browser. All scripts are included locally; no build or install is required. Choose Drums in the Editor dropdown to try beat editing.
