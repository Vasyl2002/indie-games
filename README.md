# Magic Sort

Яркая HTML5-игра: переливай цветные слои между колбами, пока каждый цвет не соберётся отдельно.

## Как запустить прямо сейчас

Игра **не** откроется, если нажать `index.html` на GitHub или в Cursor — там только код, а не сама игра.

**Открой игру в браузере по этой ссылке:**

https://raw.githack.com/Vasyl2002/indie-games/cursor/magic-sort-game-de27/index.html

## Если хочешь файлы на компьютере (без git)

1. Скачай архив: https://github.com/Vasyl2002/indie-games/archive/refs/heads/cursor/magic-sort-game-de27.zip
2. Распакуй папку
3. Открой файл `index.html` двойным кликом — появится меню Magic Sort

`git pull` игру не скачает: команда только обновляет уже клонированный репозиторий. Сама игра сейчас в ветке `cursor/magic-sort-game-de27`, а не в `main`.

## Если всё же нужен git

```bash
git clone -b cursor/magic-sort-game-de27 https://github.com/Vasyl2002/indie-games.git
cd indie-games
```

Потом открой `index.html` в браузере. Если репозиторий уже есть:

```bash
git fetch origin
git checkout cursor/magic-sort-game-de27
```

## Что внутри

- 16 уровней: легко → средне → сложно → эксперт
- Таймер 1:30 на каждом уровне
- Отмена хода, рестарт, прогресс открытия уровней
- Лёгкая фоновая музыка и отдельные кнопки «Музыка» / «Звуки»

## Архив для Яндекса

Готовый архив: `game_yandex.zip`

Внутри `index.html` лежит **сразу в корне**, без лишней папки:

```
index.html
css/
js/
promo/
```

Распакуй архив и загружай как есть. Не используй GitHub → Code → Download ZIP: тот архив оборачивает всё в ещё одну папку.

Готовые картинки лежат в папке `promo/`:

- `promo/icon-1024.png` — иконка для площадок
- `promo/magic-sort-cover.png` — обложка 16:9
- `promo/screenshot-menu.png`, `screenshot-level-easy.png`, `screenshot-level-expert.png` — реальные кадры
- `promo/magic-sort-shot-menu.png` и `magic-sort-shot-gameplay.png` — яркие промо-кадры
