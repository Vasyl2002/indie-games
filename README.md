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
