# Task Manager (Kanban + чат + роли)

Полнофункциональное учебное веб‑приложение: визуальная Kanban‑доска с drag&drop, ролевой моделью доступа, чатами внутри задач и управлением пользователями.

## Стек
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite, JWT (python‑jose), passlib.
- **Frontend:** React (Create React App), React Router, @dnd-kit (drag&drop), Axios.
- **Инфраструктура:** единый скрипт `run_all.py` для параллельного запуска фронта и бэка.

## Быстрый старт (dev)
```bash
python -m venv backend/.venv
backend/.venv/Scripts/Activate.ps1    # PowerShell
pip install -r backend/requirements.txt

cd frontend
npm ci
cd ..

# dev (npm start + uvicorn --reload)
python run_all.py --mode dev

# preview (build + npx serve -s build, uvicorn без reload)
python run_all.py --mode preview --frontend-port 3000

# если фронт должен ходить на внешний API (туннель/другой хост)
python run_all.py --mode dev --api-url https://<your-public-backend>
```
Остановка: `Ctrl+C` в том же окне — оба процесса завершаются корректно.

> Если путь к проекту содержит `!`, CRA/webpack может падать. Используйте `subst`:
> ```
> subst K: "D:\Projects!\sharaje\Kursovaya\frontend"
> cd K:\
> npm start
> ```

### Отдельный запуск
- Backend: `cd backend && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm start`

### Демо-данные
Скрипт `backend/seed_demo.py` полностью пересоздаёт SQLite и заполняет:
- пользователи: admin/admin123, ceo/ceo123, manager/manager123, employee1/emp123, employee2/emp456;
- статусы («сделать», «в работе», «на проверке», «готово»);
- задачи с разными исполнителями и общими задачами;
- чат‑сообщения от разных пользователей.
Запуск: `cd backend && python seed_demo.py`.

### Запуск через туннель / на другом хосте
- Перед `npm start` или `npm run build` задайте `REACT_APP_API_URL` на внешний адрес бэкенда (например, ngrok):  
  `REACT_APP_API_URL=https://your-tunnel.example npm start`
- CORS открыт (`allow_origins=["*"]`), фронт может обращаться с любого домена.

## Роли и доступ
- Роли: `admin`, `ceo`, `manager`, `employee`.
- Создание задач: admin/ceo/manager.
- Регистрация и изменение пользователей: admin/ceo.
- Видимость задач:
  - без исполнителя — всем;
  - постановщик и исполнитель видят всегда;
  - ранги: employee < manager < ceo < admin; можно смотреть задачи исполнителей с рангом ниже/равным своему.
  - доступ к деталям, чату и смене статуса по тем же правилам.

## Данные и БД
- `users`: id, username (уник), password_hash, password_plain (для отображения админам), role, created_at.
- `statuses`: id, name (уник), order_index.
- `tasks`: id, title, short_description, description, status_id, created_by, assignee_id?, created_at, updated_at.
- `messages`: id, content, task_id, user_id, created_at.
Сидинг статусов и добавление колонок `assignee_id`/`password_plain` выполняется при старте `app.main`.

## API (основное)
Все защищённые запросы требуют `Authorization: Bearer <token>`.
- `POST /auth/login` → `{access_token}`.
- `POST /auth/register` (admin/ceo) — `{username, password, role?}`.
- `GET /users/`, `GET /users/me`, `PATCH /users/{id}` (логин/роль/пароль, только admin/ceo).
- `GET /statuses/`.
- `GET /tasks/` — возвращает только видимые задачи, включает `assignee`, `assignee_role`, `created_by`, `is_mine`, `is_lower`.
- `POST /tasks/` — создать задачу `{title, short_description, description, status_id, assignee_id?}`.
- `GET /tasks/{id}`, `PATCH /tasks/{id}/status` (`{status}`).
- `GET|POST /tasks/{id}/messages/` — чат задачи.

## UI / взаимодействие фронта и бэка
- **Авторизация**: `/login`, хранение JWT в localStorage, декодирование роли в `AuthProvider`.
- **Доска** `/`: Kanban, drag&drop (PATCH статуса только при изменении). Форма создания задач свернута по умолчанию, доступна admin/ceo/manager. Сайдбар «пространств» фильтрует задачи по исполнителю; выбранное пространство подставляет исполнителя в форму (можно сменить). Чужие, но доступные задачи подсвечены.
- **Детали задачи** `/tasks/:id`: статус, исполнитель/постановщик, описание, чат; шапка с «Назад» и меню профиля.
- **Пользователи** `/users`: таблица логин/роль/пароль(plaintext/hash для admin/ceo)/дата; сортировка по логину/роли/дате (A→Я / Я→A); сворачиваемые формы создания и обновления (логин/роль/пароль). Сайдбар навигации стилизован так же, как на доске.

## Архитектура бэка (ключевые файлы)
- `app/main.py` — инициализация FastAPI, CORS, роутеры, сидинг статусов, проверка/добавление колонок, healthcheck.
- `app/api/tasks.py` — логика видимости `_can_view_task`, CRUD чтение, смена статуса.
- `app/api/users.py` — листинг с показом паролей для admin/ceo, PATCH (логин/роль/пароль).
- `app/api/messages.py` — чат с проверкой доступа к задаче.
- `app/api/auth.py` — login/register с ролью.
- `app/models/*` — SQLAlchemy модели; `Task`, `User`, `Status`, `Message`.
- `app/schemas/*` — Pydantic DTO.
- `app/core/security.py` — JWT, хеши паролей.

## Архитектура фронта (ключевые файлы)
- `src/pages/Board.jsx` — загрузка задач/статусов/пользователей, фильтр «пространств», drag&drop.
- `src/pages/TaskDetails.jsx` — детали + чат.
- `src/pages/Users.jsx` — таблица, сортировка, формы создания/обновления.
- `src/components/UserMenu.jsx` — меню профиля (обновить/выйти).
- `src/services/api.js` — Axios с авто‑JWT.
- `src/services/tasks.js`, `src/services/users.js` — клиенты API.
- `src/auth/AuthProvider.jsx` — контекст, декодирование JWT (username, role).
- `src/index.css` — общие стили, сайдбары, колонки, таблицы.

## Особенности UI
- Сайдбары (пространства/навигация) единообразные: полупрозрачный фон, закругления, sticky позиционирование.
- Колонки фиксированной ширины (300px), выстраиваются от левой части, скролл по оси X.
- Кнопка «Новая задача» выровнена вправо в шапке доски.
- Таблица пользователей на всю доступную ширину контейнера, сортировка на клиенте.

## Тестирование (ручное)
- Вход / защита роутов: без токена — редирект на `/login`.
- Видимость задач: employee видит только свои и без исполнителя; manager — свои и ниже; ceo/admin — все.
- Drag&drop: статус меняется только при реальном переносе.
- Чат: доступен только к видимой задаче, авторы отображаются.
- Пользователи: создание/редактирование доступно admin/ceo, сортировка работает.

## Структура репозитория (основное)
```
backend/
  app/
    api/        # роутеры
    core/       # security/config
    db/         # engine/session
    models/     # SQLAlchemy модели
    schemas/    # Pydantic схемы
    main.py
  seed_demo.py  # пересоздать БД и наполнить демо-данными
frontend/
  src/
    pages/      # Board, TaskDetails, Users, Login
    components/ # Column, TaskCard, UserMenu ...
    services/   # api, tasks, users
    auth/       # AuthProvider, ProtectedRoute
    index.css   # стили
  package.json
run_all.py
```

## Полезные команды
- Линт/сборка фронта: `cd frontend && npm run build`.
- Проверка Python модулей: `python -m compileall backend`.
- Запуск демо‑сидирования: `cd backend && python seed_demo.py`.

## Лицензия и использование
Проект учебный, может быть использован как шаблон для курсовой/пет‑проекта или как демонстрация связки FastAPI + React + JWT + Kanban.
