# Magic Sort

Bright HTML5 color-sorting puzzle for CrazyGames.

## Download

`game_crazygames.zip` — extract and `index.html` is at the archive root:

```
index.html
css/
js/
promo/
```

https://github.com/Vasyl2002/indie-games/raw/cursor/magic-sort-game-de27/game_crazygames.zip

## CrazyGames SDK v2

- Script: `https://sdk.crazygames.com/crazygames-sdk-v2.js`
- `window.CrazyGames.SDK.init()` on page start
- `gameplayStart()` when a level begins
- `gameplayStop()` on lose, pause, or leaving to the menu
- Midgame ads: `window.CrazyGames.SDK.ad.requestAd('midgame')` on lose, restart, and after a completed level

Outside CrazyGames the game still runs; ads are skipped.

## Language

Default language is **English**. Use the **EN / RU** buttons in the top-right corner to switch to Russian. The choice is saved.

## CrazyGames cover images

Exact sizes from the upload form:

- `promo/cover-1920x1080.png` — Landscape 16:9
- `promo/cover-800x1200.png` — Portrait 2:3
- `promo/cover-800x800.png` — Square 1:1

Open `index.html` or:

```bash
python3 -m http.server 8080
```
