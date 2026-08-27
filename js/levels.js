(function (global) {
  "use strict";

  global.LEVELS = [
  {
    "id": 1,
    "name": "Первые капли",
    "difficulty": "easy",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "red",
        "blue",
        "red",
        "blue"
      ],
      [
        "blue",
        "red",
        "blue",
        "red"
      ],
      [],
      []
    ]
  },
  {
    "id": 2,
    "name": "Три стихии",
    "difficulty": "easy",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "red",
        "lime",
        "blue",
        "red"
      ],
      [
        "lime",
        "blue",
        "red",
        "lime"
      ],
      [
        "blue",
        "red",
        "lime",
        "blue"
      ],
      [],
      []
    ]
  },
  {
    "id": 3,
    "name": "Радуга старт",
    "difficulty": "easy",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "red",
        "orange",
        "yellow",
        "red"
      ],
      [
        "yellow",
        "red",
        "red",
        "yellow"
      ],
      [
        "yellow",
        "orange",
        "orange",
        "orange"
      ],
      [],
      []
    ]
  },
  {
    "id": 4,
    "name": "Яркий микс",
    "difficulty": "easy",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "lime",
        "lime",
        "orange",
        "red"
      ],
      [
        "orange",
        "red",
        "red",
        "lime"
      ],
      [
        "yellow",
        "yellow",
        "yellow",
        "lime"
      ],
      [
        "red",
        "orange",
        "orange",
        "yellow"
      ],
      [],
      []
    ]
  },
  {
    "id": 5,
    "name": "Цветной вихрь",
    "difficulty": "medium",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "cyan",
        "yellow",
        "orange",
        "cyan"
      ],
      [
        "red",
        "yellow",
        "lime",
        "red"
      ],
      [
        "cyan",
        "orange",
        "lime",
        "yellow"
      ],
      [
        "orange",
        "lime",
        "red",
        "red"
      ],
      [
        "cyan",
        "orange",
        "lime",
        "yellow"
      ],
      [],
      []
    ]
  },
  {
    "id": 6,
    "name": "Пять огней",
    "difficulty": "medium",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "red",
        "cyan",
        "cyan",
        "yellow"
      ],
      [
        "lime",
        "orange",
        "lime",
        "yellow"
      ],
      [
        "orange",
        "yellow",
        "red",
        "red"
      ],
      [
        "orange",
        "lime",
        "cyan",
        "yellow"
      ],
      [
        "red",
        "lime",
        "orange",
        "cyan"
      ],
      [],
      []
    ]
  },
  {
    "id": 7,
    "name": "Неоновая башня",
    "difficulty": "medium",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "yellow",
        "orange",
        "red",
        "yellow"
      ],
      [
        "cyan",
        "orange",
        "blue",
        "lime"
      ],
      [
        "cyan",
        "blue",
        "red",
        "lime"
      ],
      [
        "yellow",
        "lime",
        "red",
        "yellow"
      ],
      [
        "lime",
        "red",
        "blue",
        "blue"
      ],
      [
        "orange",
        "cyan",
        "orange",
        "cyan"
      ],
      [],
      []
    ]
  },
  {
    "id": 8,
    "name": "Лаборатория",
    "difficulty": "medium",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "blue",
        "yellow",
        "red",
        "blue"
      ],
      [
        "blue",
        "lime",
        "orange",
        "yellow"
      ],
      [
        "lime",
        "red",
        "lime",
        "cyan"
      ],
      [
        "orange",
        "cyan",
        "cyan",
        "blue"
      ],
      [
        "lime",
        "orange",
        "yellow",
        "cyan"
      ],
      [
        "orange",
        "yellow",
        "red",
        "red"
      ],
      [],
      []
    ]
  },
  {
    "id": 9,
    "name": "Магический шторм",
    "difficulty": "hard",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "yellow",
        "purple",
        "cyan",
        "red"
      ],
      [
        "purple",
        "purple",
        "lime",
        "blue"
      ],
      [
        "orange",
        "cyan",
        "cyan",
        "yellow"
      ],
      [
        "blue",
        "orange",
        "blue",
        "blue"
      ],
      [
        "red",
        "cyan",
        "yellow",
        "orange"
      ],
      [
        "lime",
        "lime",
        "purple",
        "red"
      ],
      [
        "red",
        "yellow",
        "lime",
        "orange"
      ],
      [],
      []
    ]
  },
  {
    "id": 10,
    "name": "Семь ключей",
    "difficulty": "hard",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "yellow",
        "purple",
        "red",
        "cyan"
      ],
      [
        "yellow",
        "red",
        "blue",
        "blue"
      ],
      [
        "red",
        "purple",
        "blue",
        "yellow"
      ],
      [
        "cyan",
        "purple",
        "lime",
        "lime"
      ],
      [
        "orange",
        "orange",
        "orange",
        "cyan"
      ],
      [
        "yellow",
        "lime",
        "red",
        "cyan"
      ],
      [
        "orange",
        "blue",
        "lime",
        "purple"
      ],
      [],
      []
    ]
  },
  {
    "id": 11,
    "name": "Хрустальный хаос",
    "difficulty": "hard",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "orange",
        "blue",
        "cyan",
        "yellow"
      ],
      [
        "pink",
        "pink",
        "red",
        "lime"
      ],
      [
        "yellow",
        "red",
        "orange",
        "purple"
      ],
      [
        "red",
        "purple",
        "blue",
        "lime"
      ],
      [
        "blue",
        "red",
        "yellow",
        "orange"
      ],
      [
        "blue",
        "cyan",
        "pink",
        "orange"
      ],
      [
        "lime",
        "lime",
        "cyan",
        "yellow"
      ],
      [
        "purple",
        "purple",
        "pink",
        "cyan"
      ],
      [],
      []
    ]
  },
  {
    "id": 12,
    "name": "Звездный коктейль",
    "difficulty": "hard",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "lime",
        "red",
        "purple",
        "cyan"
      ],
      [
        "lime",
        "cyan",
        "yellow",
        "orange"
      ],
      [
        "red",
        "purple",
        "pink",
        "red"
      ],
      [
        "orange",
        "lime",
        "cyan",
        "blue"
      ],
      [
        "orange",
        "blue",
        "purple",
        "yellow"
      ],
      [
        "red",
        "orange",
        "pink",
        "cyan"
      ],
      [
        "yellow",
        "blue",
        "lime",
        "pink"
      ],
      [
        "yellow",
        "blue",
        "purple",
        "pink"
      ],
      [],
      []
    ]
  },
  {
    "id": 13,
    "name": "Аркана",
    "difficulty": "expert",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "lime",
        "blue",
        "orange",
        "orange"
      ],
      [
        "yellow",
        "blue",
        "lime",
        "orange"
      ],
      [
        "red",
        "cyan",
        "red",
        "yellow"
      ],
      [
        "cyan",
        "cyan",
        "blue",
        "cyan"
      ],
      [
        "lime",
        "red",
        "lime",
        "blue"
      ],
      [
        "yellow",
        "red",
        "yellow",
        "orange"
      ],
      []
    ]
  },
  {
    "id": 14,
    "name": "Последняя колба",
    "difficulty": "expert",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "cyan",
        "orange",
        "purple",
        "cyan"
      ],
      [
        "blue",
        "lime",
        "red",
        "yellow"
      ],
      [
        "pink",
        "red",
        "lime",
        "blue"
      ],
      [
        "pink",
        "mint",
        "cyan",
        "red"
      ],
      [
        "orange",
        "orange",
        "purple",
        "lime"
      ],
      [
        "mint",
        "lime",
        "purple",
        "cyan"
      ],
      [
        "blue",
        "yellow",
        "blue",
        "mint"
      ],
      [
        "mint",
        "orange",
        "yellow",
        "red"
      ],
      [
        "yellow",
        "pink",
        "pink",
        "purple"
      ],
      [],
      []
    ]
  },
  {
    "id": 15,
    "name": "Гранд-финал",
    "difficulty": "expert",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "blue",
        "lime",
        "blue",
        "purple"
      ],
      [
        "red",
        "red",
        "cyan",
        "cyan"
      ],
      [
        "yellow",
        "yellow",
        "yellow",
        "purple"
      ],
      [
        "orange",
        "red",
        "lime",
        "yellow"
      ],
      [
        "red",
        "orange",
        "purple",
        "purple"
      ],
      [
        "lime",
        "cyan",
        "orange",
        "orange"
      ],
      [
        "cyan",
        "blue",
        "blue",
        "lime"
      ],
      []
    ]
  },
  {
    "id": 16,
    "name": "Мастер сортировки",
    "difficulty": "expert",
    "time": 90,
    "capacity": 4,
    "bottles": [
      [
        "red",
        "mint",
        "red",
        "purple"
      ],
      [
        "mint",
        "mint",
        "pink",
        "lime"
      ],
      [
        "lime",
        "orange",
        "cyan",
        "purple"
      ],
      [
        "purple",
        "cyan",
        "cyan",
        "red"
      ],
      [
        "pink",
        "purple",
        "blue",
        "violet"
      ],
      [
        "yellow",
        "lime",
        "blue",
        "orange"
      ],
      [
        "pink",
        "lime",
        "orange",
        "yellow"
      ],
      [
        "orange",
        "cyan",
        "red",
        "blue"
      ],
      [
        "pink",
        "blue",
        "mint",
        "violet"
      ],
      [
        "yellow",
        "yellow",
        "violet",
        "violet"
      ],
      [],
      []
    ]
  }
];
})(typeof window !== "undefined" ? window : global);
