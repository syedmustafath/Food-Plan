# Weekly Food Plan

A weekly food plan with a day-by-day checklist, a progress tracker and a shopping list.
Data lives in Supabase, so it syncs live across all your devices. Built for personal use: there is no sign-in.

Static site: `index.html`, `styles.css`, `app.js`, `config.js`. No build step.

## Setup

1. Create a project at <https://supabase.com>.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables and enables realtime.
3. In **Project Settings -> API**, copy the Project URL and the `anon` public key into [`config.js`](config.js).
4. Serve the folder locally:

   ```bash
   python3 -m http.server 8000
   ```

   Then open <http://localhost:8000>.

## Deploy on Vercel

Import the repo in Vercel as a static project (Framework Preset: Other, no build command, output directory `.`). Open the Vercel URL on every device.

## Privacy note

There are no accounts, so the anon key in `config.js` can read and write the two tables. That is fine for a personal app, but anyone who has your site URL can view and edit the data. If you ever want it locked down, add Supabase Auth and restrict the policies to `authenticated`.
