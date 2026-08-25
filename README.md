# indie-games

## Pair Pop 3D

3D match game in `match-3d/`. Open `match-3d/index.html`, or from the repo root:

```bash
python3 -m http.server 8080
```

Then go to `http://localhost:8080/match-3d/`.

Tap toys in the pile, pair two identical ones in a 6-slot tray, and clear 20 levels. Timer goes from 45 seconds on easy levels up to 3:00. When time runs out you can watch a placeholder ad for +1:00 (real SDK can be plugged in later).

Needs a network connection once to load Three.js from the CDN.

## Magic Sort

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
