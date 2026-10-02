# Chops User Guide

Chops is a practice tracker for musicians. You build a queue of things to practice, time each one, record yourself on audio or video, and look back at your history and statistics.

This guide covers Chops 0.8. Press **?** in the app at any time for the keyboard shortcuts and a short version of this guide.

- [Getting started](#getting-started)
- [Practice](#practice)
- [Recording audio](#recording-audio)
- [Recording video](#recording-video)
- [Metronome](#metronome)
- [Items](#items)
- [To Do](#to-do)
- [Notes](#notes)
- [Templates](#templates)
- [History](#history)
- [Stats](#stats)
- [Settings](#settings)
- [Where your files are kept](#where-your-files-are-kept)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [For tool builders: the To Do Inbox](#for-tool-builders-the-to-do-inbox)

---

## Getting started

**Choose where to keep your data.** The first time you open Chops it asks where to store your practice data. **Use default location** puts it in `Documents/Music Practice Log`. **Choose a folder** lets you pick any folder, including a synced one such as Dropbox or iCloud Drive. You can change this later in Settings.

**Welcome.** With no items or sessions yet, Chops shows a short welcome. **Get Started** opens the item picker so you can add your first practice items.

**Getting around.** The tabs are **Practice**, **Items**, **To Do**, **Templates**, **History**, **Stats** and **Settings**. On a narrow window they move to the bottom of the screen. The moon/sun button at the top right switches between light and dark mode. The small code under it is the build number, handy for checking which version you're running. Chops remembers the window's size and position (and which screen it was on) from the last time you quit.

---

## Practice

The Practice tab is where you work through a session.

### Build the queue

Click **Add items to start practicing** (or **Add Items** once the queue has something in it) to open the item picker. Click **Add to Session** on each item you want. You can also create new items right there; new items made in the picker go straight into the session.

In the queue:

- **▲ / ▼** reorder items.
- **▶** makes that item the current one and starts timing it.
- **×** removes the item. Any audio recorded during it goes to the Trash.

You can also fill the queue from a [template](#templates) or copy a past session's items from [History](#history).

### Timing

The large clock is **Total Session Time**. Under it, **Practicing: _item_** shows the time on the current item.

- Press the play button or **Space** to start or pause. Pausing stops both clocks.
- Clicking **▶** on another item switches the item clock over without stopping the session clock. The current item is marked **NOW**.
- **Fix a time:** pause the session, then click any item's time (it shows a pencil). Type minutes (`12`), minutes and seconds (`12:30`), or hours (`1:02:30`) and press **Enter**. The session total changes by the same amount.

Your queue, item times and session time are saved as you go, so if you quit mid-session Chops picks up where you left off.

### Coach notes and attachments

If the current item has **coach notes**, they're shown on the timer card under its name, so a teacher's tips are in front of you while you practice. A queue item with notes shows a small speech-bubble icon; hover it to read them.

If the current item has attachments (links or PDFs), they appear as buttons on the timer card. Links open in your browser; PDFs open in your PDF app. Add coach notes and attachments on the [Items](#items) tab.

### Practice notes

Open **Practice Notes** under the timer to jot down how the session went. Bold, italic, underline and lists are available. Notes are kept as you type, even if you switch tabs or quit, and are saved with the session.

### Save the session

When you're done, click **Save Session** (or **⌘S** / **Ctrl+S**). Chops stores the date, total time, each item's time, your notes and your recordings, then clears the queue. A summary shows this session, your month so far and your current streak.

**Reset** (the circular arrow) clears the timer, queue, notes and recordings without saving. Audio recordings go to the Trash; video files stay in your video folder.

**Save Template** (above the queue) saves the current items, in order, as a reusable [template](#templates).

The session keeps running while you look at other tabs: timers keep counting and an audio recording in progress carries on. The video recorder stays on screen until you close it.

If you quit (⌘Q) or close the window during a session, Chops asks whether to **Save & Quit** (the session goes to History) or **Just Quit**. Just quitting keeps the session: the queue, times, notes and recordings are all there when you open Chops again.

---

## Recording audio

Once a session has started, click the **microphone** on the timer card (or press **R**) to record. Click it again (or press **R**) to stop.

After stopping you can play the take back, give it a name and **Save** it, or discard it with the trash icon. Saved recordings appear in the **Recordings** list below and are tied to the item you were practicing when you started.

In the Recordings list:

- **▶** plays a recording.
- The **trash icon** deletes it after asking. The file goes to the Trash, so you can get it back.

Audio is recorded straight from your input, without echo cancellation, noise suppression or automatic gain. If a take has sound on only one side (for example an interface with your guitar on input 1), Chops saves it as a centered mono WAV so it doesn't play from one speaker. The first time you record, macOS asks for microphone access.

To keep a copy outside Chops, use **Export WAV** on the recording in [History](#history); Chops asks where to save it.

---

## Recording video

Video recording is for capturing a performance: camera plus any audio input, including a virtual device such as Loopback that carries your amp modeler and backing track.

Once a session has started, click the **video camera** on the timer card (or press **V**).

### Set up

- **Camera** and **Audio input** choose your devices. Chops remembers them.
- The **level meter** shows your audio. Aim for green and yellow; red means you're close to clipping.
- Audio is recorded in stereo and untouched, exactly as your input sends it.

The first time, macOS asks for camera and microphone access.

### Record

- **Record** (or **Space** / **R**) starts recording. Press it again to stop.
- **Count-in** plays 1 or 2 bars of clicks first, with large beat numbers on screen (beat 1 in red). Set the tempo in the **at … BPM** box; this also sets the metronome. Choose **Off** to start immediately. Recording actually starts one beat before the count-in ends, so your first note isn't clipped. Pressing Record during the count-in cancels it.
- **Pause** (or **P**) pauses the take; **Resume** carries on in the same file. The timer in the corner shows recorded time and doesn't count pauses.
- **Esc** closes the window when you're not recording.

The video is written to disk as you record, so a long take doesn't fill up memory.

### Review and save

When you stop, the take plays back.

- Type a name and click **Save** (or press **Enter**). The file is renamed to include the name and added to the session's Recordings.
- Tick **Open in default video app after saving** to open the file straight away, for example in QuickTime to trim it. Chops remembers this setting.
- The **folder icon** shows the file in Finder.
- The **trash icon** discards the take (it goes to the Trash) and returns to recording.
- Closing without saving keeps the file in your video folder but doesn't add it to the session.

Videos are saved as MP4 (H.264/AAC) on macOS and WebM on Windows, in the video folder set in [Settings](#settings) (default `Movies/Chops`).

### Watching videos

Click a video in the Recordings list or in History to play it. **Show in Finder** and **Open** (in your default video app) are there too.

---

## Metronome

Click the metronome icon on the timer card (it shows the current BPM) or press **M**.

- Play/pause starts and stops the click.
- Set the tempo with the slider (40–240 BPM) or the preset buttons (80, 100, 120, 140, 160, 180).
- **K** starts and stops the metronome even with the popup closed.
- **[** and **]** step down or up to the next preset.
- Closing the popup stops the metronome.

The metronome starts at 120 BPM each time you open Chops. Its keys work on the Practice tab.

---

## Items

The Items tab is your library of things to practice.

**Add an item:** type a name and press **Enter** or **+**. Click **▼** first to set a **category**, **tags**, **coach notes** and **attachments** before adding.

- **Categories:** Scales, Technique, Repertoire, Sight Reading, Theory, Ear Training.
- **Tags:** your own labels. Type to pick an existing tag or create a new one.
- **Coach notes:** free text that travels with the item, such as a teacher's tips or what to focus on. They're shown on the Practice tab while the item is being practiced.

**Filter** the list by category and tags with the **Filters** button. Several tags together show items that have all of them.

On each item:

- The row shows how many sessions it has been in and the total time spent on it. A speech-bubble icon means it has coach notes.
- Click the row to see its coach notes and attachments.
- The **paperclip** adds an attachment: a **link** (web address) or a **PDF** (up to 2 MB).
- The **pencil** edits the name, category, tags and coach notes. Clear the notes to remove them.
- **Archive** hides the item from your library without losing its history.

The **Archived** tab lists archived items. **Restore** brings one back; **Delete** removes it for good (after asking). Past sessions keep the item's name either way.

---

## To Do

A place for things you want to practice later.

- Type an idea and press **Enter** or **Add**.
- **Move to practice items** (the arrow) turns it into an item in your library.
- **Archive** sets it aside; **Delete** removes it after asking.
- The **Archived** tab lets you restore or delete archived ideas.

- The **pencil** edits a to-do: its name, a **note**, a **link** (a web address or a file path) and a **label**, such as who suggested it. Leave a field blank to remove it.
- A to-do with a link shows an **open** button. A label appears as a tag like *Guitar teacher · Sep 24*, and once any to-do has one, chips at the top filter the list by label (**Mine** shows the unlabeled ones).
- Moving a to-do to practice items keeps its link as an attachment and its note as the item's coach notes.

Other apps and scripts can add labeled to-dos too; see [For tool builders](#for-tool-builders-the-to-do-inbox).

---

## Notes

Free-form pages for anything that isn't a practice item or a to-do: questions that come up during a session to ask your teacher, a list of songs to learn, ideas for the next video.

- **New Note** opens a blank note. Give it a title and write in the body; bold, italic, underline and lists work as in Practice Notes. Everything saves as you type. **Done** (or **Esc**) closes the editor.
- Each note shows its title, the first couple of lines, and when it was last edited. Click a note to read all of it; double-click or click the **pencil** to edit.
- **Archive** sets a note aside; **Delete** removes it after asking. The **Archived** tab lets you read, restore or delete archived notes.

Notes aren't tied to a session or an item. A session's **Practice Notes** are saved with that session in History; an item's **coach notes** stay with the item.

---

## Templates

Templates are saved queues you can reload, such as a warm-up routine or a set list.

- **New Template** opens the editor. Name it, search your items and click **+** to add them. Use **▲ / ▼** to set the order. An item can appear more than once.
- **Save Template** on the Practice tab saves the current queue as a template.
- **Load** replaces the current queue with the template's items, each starting at 0:00, and takes you to Practice. If a session is in progress, Chops asks first.
- The **pencil** edits a template; the **trash icon** deletes it. Deleting a template doesn't affect your items or history.

---

## History

History lists your saved sessions by day, newest first. Click a session to expand it.

- **Practice Notes** and each item's time are shown.
- **Copy to Session** adds the session's items to your current queue, each at 0:00.
- **Recordings:** play audio, **Export WAV** to save a copy wherever you choose, play videos, or **Show in Finder**.
- The **trash icon** deletes the session after asking. Its audio recordings go to the Trash; its videos stay in your video folder.

---

## Stats

Your practice statistics, in four views. The **All Tags** menu at the top narrows everything to items with one tag.

- **Overview:** time and session counts for this week, month, year and all time; your current streak; your top tags this month (click one to filter); and totals.
- **Calendar:** the last 30 days, shaded by how long you practiced. Hover a day for details.
- **Categories:** time spent in each category.
- **Items:** your top items by time, number of sessions or most recent, plus **Needs Attention**: items you haven't practiced in 30 days or more.

---

## Settings

- **Color Theme:** six color schemes. Light and dark mode are set with the moon/sun button in the header.
- **Storage Location:** where your practice data file lives. **Change Data Location** copies your data to a new folder and uses it from then on (the old copy stays but is no longer updated). **Reset Storage** makes Chops ask for a folder again the next time it opens; it doesn't delete anything.
- **Video Folder:** where videos are saved (default `Movies/Chops`). **Change Video Folder** picks a new one, **Show in Finder** opens it, and **Use Default** switches back. Videos you've already recorded stay where they are.
- **Backup & Restore:** **Export Backup** saves your items, sessions, tags, to-dos, notes and templates to a file. **Import Backup** replaces your current data with a backup (after asking).
- **Data Summary:** counts of your items, sessions and more.
- **Manage Tags:** removes tags from the suggestion list. Items that already use a tag keep it.
- **Delete History:** delete all sessions, one day's, or a date range. Audio in those sessions goes to the Trash; videos stay.
- **Reset All Data:** clears everything and starts fresh. Export a backup first.

> **Backups don't include recordings.** Export Backup saves your data but not the audio and video files themselves. Back those up separately (see below), for example with Time Machine.

---

## Where your files are kept

| What | Where (macOS) |
|---|---|
| Practice data | `practice-log-data.json` in your data folder (default `Documents/Music Practice Log`) |
| Videos | Your video folder (default `Movies/Chops`), named `Chops <date> <time> <name>.mp4` |
| Audio recordings | Kept by Chops in `~/Library/Application Support/com.chops.practice/Audio Recordings`. You don't need to manage these. |
| PDF attachments | Inside the practice data file |

**Deleting things.** Chops never erases a recording outright; files go to the Trash (the Recycle Bin on Windows), so a mistake can be undone.

- Deleting a recording from the Practice tab's Recordings list moves its file (audio or video) to the Trash.
- Removing a queue item, resetting a session, loading a template, deleting sessions or resetting all data moves their **audio** to the Trash. **Videos** are yours to manage and stay in your video folder.
- A file is never trashed while another session still uses it.

**Syncing between computers.** A synced data folder carries your items and sessions. Audio recordings stay on the computer that made them, and videos live wherever your video folder is.

---

## Keyboard shortcuts

On Windows use **Ctrl** where this says **⌘**. Single-key shortcuts don't fire while you're typing in a text field.

### Practice tab

| Key | Action |
|---|---|
| Space | Start / pause the session |
| ⌘S | Save the session |
| R | Start / stop an audio recording (once the session has started) |
| V | Open the video recorder (once the session has started) |
| M | Open / close the metronome |
| K | Start / stop the metronome |
| [ / ] | Metronome tempo down / up a preset |

### Video recorder

| Key | Action |
|---|---|
| Space or R | Record / stop (cancels a count-in) |
| P | Pause / resume |
| Enter | Save the take (in the name field) |
| Esc | Close (when not recording) |

### Anywhere

| Key | Action |
|---|---|
| ⌘1 – ⌘7 | Practice, Items, To Do, Notes, Templates, History, Stats |
| ⌘, | Settings |
| ? | Help |

### Editing

| Key | Action |
|---|---|
| Enter / Esc | Save / cancel when editing an item, a time or a name |
| ⌘B, ⌘I, ⌘U | Bold, italic, underline in practice notes |
| Tab | Indent in practice notes |

---

## For tool builders: the To Do Inbox

A script or another app can add to-dos to Chops, even while Chops is open, by dropping a JSON file in the **To Do Inbox** folder inside the data folder (create the folder if it isn't there). Chops picks the file up when it starts or when you switch back to it, adds the to-dos, and moves the file into **To Do Inbox/Imported**.

```json
{ "todos": [
  { "id": "lesson-2026-09-24-01", "name": "Loop the bend at 60 bpm",
    "source": "Guitar teacher", "sourceDate": "2026-09-24",
    "note": "12:34 – let the wrist float", "link": "https://example.com/lesson" }
] }
```

- Only `name` is required. `source` becomes the label and `sourceDate` (YYYY-MM-DD) is shown next to it.
- Give each to-do a stable `id`. If a to-do with that `id` is already in the active list, its details are replaced with the new ones; one that was archived is left alone.
- Write the file under a temporary name and rename it to `.json` when it's complete, so Chops never reads half a file. A file that can't be parsed is left in place and tried again later.
- Don't write to `practice-log-data.json` directly while Chops is open; it keeps to-dos in memory and would overwrite your change.
