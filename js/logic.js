(function (global) {
  "use strict";

  function cloneBottles(bottles) {
    return bottles.map(function (bottle) {
      return bottle.slice();
    });
  }

  function topColor(bottle) {
    return bottle.length ? bottle[bottle.length - 1] : null;
  }

  function topRun(bottle) {
    if (!bottle.length) {
      return { color: null, count: 0 };
    }
    var color = bottle[bottle.length - 1];
    var count = 0;
    for (var i = bottle.length - 1; i >= 0 && bottle[i] === color; i -= 1) {
      count += 1;
    }
    return { color: color, count: count };
  }

  function canPour(from, to, capacity) {
    if (!from.length) {
      return false;
    }
    if (to.length >= capacity) {
      return false;
    }
    var color = from[from.length - 1];
    if (to.length && to[to.length - 1] !== color) {
      return false;
    }
    return true;
  }

  function pourAmount(from, to, capacity) {
    if (!canPour(from, to, capacity)) {
      return 0;
    }
    return Math.min(topRun(from).count, capacity - to.length);
  }

  function pour(from, to, capacity) {
    var amount = pourAmount(from, to, capacity);
    for (var i = 0; i < amount; i += 1) {
      to.push(from.pop());
    }
    return amount;
  }

  function isBottleComplete(bottle, capacity) {
    if (!bottle.length) {
      return true;
    }
    if (bottle.length !== capacity) {
      return false;
    }
    var color = bottle[0];
    for (var i = 1; i < bottle.length; i += 1) {
      if (bottle[i] !== color) {
        return false;
      }
    }
    return true;
  }

  function isSolved(bottles, capacity) {
    for (var i = 0; i < bottles.length; i += 1) {
      if (!isBottleComplete(bottles[i], capacity)) {
        return false;
      }
    }
    return true;
  }

  function sortedCount(bottles, capacity) {
    var done = 0;
    for (var i = 0; i < bottles.length; i += 1) {
      var bottle = bottles[i];
      if (bottle.length === capacity && isBottleComplete(bottle, capacity)) {
        done += 1;
      }
    }
    return done;
  }

  function colorCount(bottles) {
    var seen = {};
    var total = 0;
    for (var i = 0; i < bottles.length; i += 1) {
      for (var j = 0; j < bottles[i].length; j += 1) {
        var color = bottles[i][j];
        if (!seen[color]) {
          seen[color] = true;
          total += 1;
        }
      }
    }
    return total;
  }

  function hashState(bottles) {
    return bottles
      .map(function (bottle) {
        return bottle.join(",");
      })
      .sort()
      .join("|");
  }

  function isUselessPour(from, to) {
    if (!to.length && topRun(from).count === from.length) {
      return true;
    }
    return false;
  }

  function listMoves(bottles, capacity) {
    var moves = [];
    var i;
    var j;
    for (i = 0; i < bottles.length; i += 1) {
      for (j = 0; j < bottles.length; j += 1) {
        if (i === j) {
          continue;
        }
        if (!canPour(bottles[i], bottles[j], capacity)) {
          continue;
        }
        if (isUselessPour(bottles[i], bottles[j])) {
          continue;
        }
        var amount = pourAmount(bottles[i], bottles[j], capacity);
        var completes =
          bottles[j].length + amount === capacity &&
          (!bottles[j].length || bottles[j][bottles[j].length - 1] === bottles[i][bottles[i].length - 1]);
        var sameColor = bottles[j].length > 0;
        moves.push({
          from: i,
          to: j,
          amount: amount,
          score: (completes ? 300 : 0) + (sameColor ? 40 : 0) + amount,
        });
      }
    }
    moves.sort(function (a, b) {
      return b.score - a.score;
    });
    return moves;
  }

  function findSolution(bottles, capacity, limit) {
    var maxVisited = limit || 120000;
    var start = cloneBottles(bottles);
    if (isSolved(start, capacity)) {
      return [];
    }
    var visited = Object.create(null);
    var stack = [{ bottles: start, moves: [] }];
    visited[hashState(start)] = true;
    var seen = 1;

    while (stack.length) {
      var node = stack.pop();
      var moves = listMoves(node.bottles, capacity);
      for (var m = 0; m < moves.length; m += 1) {
        var next = cloneBottles(node.bottles);
        pour(next[moves[m].from], next[moves[m].to], capacity);
        var key = hashState(next);
        if (visited[key]) {
          continue;
        }
        var path = node.moves.concat([{ from: moves[m].from, to: moves[m].to }]);
        if (isSolved(next, capacity)) {
          return path;
        }
        visited[key] = true;
        seen += 1;
        if (seen > maxVisited) {
          return null;
        }
        stack.push({ bottles: next, moves: path });
      }
    }
    return null;
  }

  function isSolvable(bottles, capacity, limit) {
    var maxVisited = limit || 120000;
    var start = cloneBottles(bottles);
    if (isSolved(start, capacity)) {
      return true;
    }
    var visited = Object.create(null);
    var stack = [start];
    visited[hashState(start)] = true;
    var seen = 1;

    while (stack.length) {
      var state = stack.pop();
      var moves = listMoves(state, capacity);
      for (var m = 0; m < moves.length; m += 1) {
        var next = cloneBottles(state);
        pour(next[moves[m].from], next[moves[m].to], capacity);
        var key = hashState(next);
        if (visited[key]) {
          continue;
        }
        if (isSolved(next, capacity)) {
          return true;
        }
        visited[key] = true;
        seen += 1;
        if (seen > maxVisited) {
          return false;
        }
        stack.push(next);
      }
    }
    return false;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    var items = list.slice();
    for (var i = items.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return items;
  }

  function dealBottles(colorIds, emptyCount, capacity, rng) {
    var pool = [];
    var i;
    var c;
    for (c = 0; c < colorIds.length; c += 1) {
      for (i = 0; i < capacity; i += 1) {
        pool.push(colorIds[c]);
      }
    }
    pool = shuffle(pool, rng);
    var bottles = [];
    var index = 0;
    for (c = 0; c < colorIds.length; c += 1) {
      bottles.push(pool.slice(index, index + capacity));
      index += capacity;
    }
    for (i = 0; i < emptyCount; i += 1) {
      bottles.push([]);
    }
    return bottles;
  }

  function generatePuzzle(colorIds, emptyCount, capacity, seed, attempts) {
    var maxAttempts = attempts || 80;
    var baseSeed = seed || 1;
    for (var n = 0; n < maxAttempts; n += 1) {
      var rng = mulberry32(baseSeed + n * 9973);
      var bottles = dealBottles(colorIds, emptyCount, capacity, rng);
      if (isSolved(bottles, capacity)) {
        continue;
      }
      if (isSolvable(bottles, capacity, colorIds.length >= 8 ? 180000 : 80000)) {
        return bottles;
      }
    }
    return null;
  }

  global.SortLogic = {
    cloneBottles: cloneBottles,
    topColor: topColor,
    topRun: topRun,
    canPour: canPour,
    pourAmount: pourAmount,
    pour: pour,
    isBottleComplete: isBottleComplete,
    isSolved: isSolved,
    sortedCount: sortedCount,
    colorCount: colorCount,
    hashState: hashState,
    listMoves: listMoves,
    isSolvable: isSolvable,
    findSolution: findSolution,
    mulberry32: mulberry32,
    shuffle: shuffle,
    dealBottles: dealBottles,
    generatePuzzle: generatePuzzle,
  };
})(typeof window !== "undefined" ? window : global);
