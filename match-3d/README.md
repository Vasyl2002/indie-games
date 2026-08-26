# Pair Pop 3D

Browser 3D match game for CrazyGames: tap toys in the pile, pair two identical ones in a 6-slot tray, and clear the goals before the timer ends.

## Play

Open `match-3d/index.html`, or from the repo root:

```bash
python3 -m http.server 8080
```

Then go to `http://localhost:8080/match-3d/`.

## CrazyGames zip

`pair_pop_crazygames.zip` — extract and `index.html` is at the archive root:

```
index.html
css/
js/
promo/
```

https://github.com/Vasyl2002/indie-games/raw/cursor/magic-sort-game-de27/pair_pop_crazygames.zip

## CrazyGames SDK v2

- Script: `https://sdk.crazygames.com/crazygames-sdk-v2.js`
- `CrazyGames.SDK.init()` on page start
- `gameplayStart()` when a level begins
- `gameplayStop()` on pause, overlay, menu, or ads
- Midgame ads: `ad.requestAd('midgame')` after Retry and after a completed level
- Rewarded ads: `ad.requestAd('rewarded')` for +1:00 when time runs out

Outside CrazyGames the game still runs; midgame ads are skipped.

## First version

- 20 levels, easy → hard
- Timer from 45 seconds up to 3:00
- 6 tray slots, match **2** identical toys
- Gray **stones** fill tray slots and never match
- English / Russian toggle
