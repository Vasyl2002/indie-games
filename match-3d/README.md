# Pair Pop 3D

Browser 3D match game: tap toys in the pile, pair two identical ones in a 6-slot tray, and clear the goals before the timer ends.

## Play

Open `match-3d/index.html` in a browser, or from the repo root:

```bash
python3 -m http.server 8080
```

Then go to `http://localhost:8080/match-3d/`.

Needs a network connection once to load Three.js from the CDN.

## First version

- 20 levels, easy → hard, with a denser pile on later stages
- Timer from 45 seconds up to 3:00
- 6 tray slots, match **2** identical toys
- Gray **stones** clutter every pile. They are not goals; pair two to clear them from the tray
- Extra minute via a rewarded-ad stub (`js/ads.js`). Hook a real SDK later with `window.GameAdsSDK.showRewarded(callback)`
- English / Russian toggle
