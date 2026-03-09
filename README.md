# WAVR 🎵

A personal audio player web app with cross-device sync, YouTube integration, Spotify support, and PWA installation for Android.

![WAVR](https://img.shields.io/badge/WAVR-Personal%20Player-7cfc8a?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Installable-blue?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Synced-3ECF8E?style=flat-square)

---

## Features

- **Local audio files** — upload and play MP3, WAV, FLAC and more
- **YouTube playlists** — paste a playlist URL to import tracks with metadata and thumbnails
- **Spotify integration** — connect your account and search tracks (preview or full playback with Premium)
- **Cross-device sync** — your library, playback history and settings sync across all devices via Supabase
- **Video attachments** — attach an MP4 video to any local track
- **Folders** — organize your library into custom folders
- **Audio visualizer** — real-time FFT bar visualizer
- **Resizable sidebar** — drag to resize, hides on mobile
- **Queue drawer** — slide-up song queue accessible from the player bar
- **PWA** — installable on Android as a home screen app with background playback and lock screen controls
- **Media Session API** — controls in notification bar and lock screen

---

## Tech Stack

- Vanilla HTML/CSS/JS — single file, no build step
- [Supabase](https://supabase.com) — authentication, database, file storage
- [Spotify Web API](https://developer.spotify.com) — OAuth PKCE, search, playback
- YouTube IFrame API — playlist import and embedded playback
- Web Audio API — visualizer and background audio keep-alive
- Media Session API — OS-level playback controls

---

## Setup

### 1. Supabase

Create a free project at [supabase.com](https://supabase.com) and run the following SQL:

```sql
-- Tables
create table wavr_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  spotify_token text, volume float default 0.8,
  folders_json text, updated_at timestamptz default now()
);
create table wavr_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  track_id text not null, title text not null, artist text,
  source_type text not null, preview_url text, spotify_uri text,
  art_url text, duration float default 0,
  audio_storage_path text, video_storage_path text,
  position integer default 0, created_at timestamptz default now()
);
create table wavr_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  track_id text not null, position_seconds float default 0,
  played_at timestamptz default now(), unique(user_id, track_id)
);

-- Row Level Security
alter table wavr_settings enable row level security;
alter table wavr_tracks   enable row level security;
alter table wavr_history  enable row level security;
create policy "own settings" on wavr_settings for all using (auth.uid() = user_id);
create policy "own tracks"   on wavr_tracks   for all using (auth.uid() = user_id);
create policy "own history"  on wavr_history  for all using (auth.uid() = user_id);

-- Storage policies (run for both wavr-audio and wavr-videos buckets)
create policy "user audio upload" on storage.objects
  for insert with check (bucket_id = 'wavr-audio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user audio read" on storage.objects
  for select using (bucket_id = 'wavr-audio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user audio delete" on storage.objects
  for delete using (bucket_id = 'wavr-audio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user audio update" on storage.objects
  for update using (bucket_id = 'wavr-audio' and auth.uid()::text = (storage.foldername(name))[1]);
```

Create two **private** storage buckets: `wavr-audio` and `wavr-videos`, then repeat the storage policies above replacing `wavr-audio` with `wavr-videos`.

### 2. Spotify (optional)

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app
2. Add your GitHub Pages URL as a **Redirect URI** (e.g. `https://yourusername.github.io/wavr/`)
3. Copy your **Client ID** and paste it into `index.html` where `SPOTIFY_CLIENT_ID` is defined

### 3. Deploy to GitHub Pages

1. Fork or clone this repo
2. Go to **Settings → Pages → Deploy from branch → main → / (root)**
3. Your app will be live at `https://yourusername.github.io/wavr/`

---

## Install as Android App (PWA)

1. Open your GitHub Pages URL in **Chrome** on Android
2. Tap **⋮ → Add to Home Screen**
3. Tap **Install**

WAVR will open fullscreen like a native app with background playback support.

---

## File Structure

```
/
├── index.html      # Full app — single file
├── manifest.json   # PWA manifest
├── sw.js           # Service worker (offline + auto-update)
├── icon-192.png    # App icon
├── icon-512.png    # App icon (large)
└── README.md
```

---

## License

Personal use. Not affiliated with Spotify, YouTube, or Google.
