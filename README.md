# LoL Skin Bracket

Static League of Legends skin tournament page built for GitHub Pages.

## What it does

- Uses your uploaded skin list as entrants.
- Fetches skin metadata and art from CommunityDragon at runtime.
- Randomizes round 1 into a single-elimination bracket with byes handled automatically.
- Lets you switch between viewer mode and admin mode.
- Saves the bracket locally in the browser and supports export/import JSON.

## Deploy to GitHub Pages

1. Push the contents of this folder to a GitHub repository.
2. In GitHub, open `Settings -> Pages`.
3. Set the source to deploy from the main branch root.
4. Wait for the Pages URL to be generated.

## Important limitation

This is a static app. GitHub Pages does not give you a backend database, so public visitors cannot submit shared votes to one central store. The current setup is meant for:

- public viewing
- local "my pick" clicks per browser
- admin advancement of official winners
- manual sharing of bracket state through export/import JSON

If you want true shared audience voting next, the lightest upgrade is adding Supabase or Firebase.
