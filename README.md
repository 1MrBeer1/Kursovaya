# Task Manager

Небольшой Kanban‑трекер с ролями, чатами внутри задач и JWT-аутентификацией.

## Технологии
- Backend: FastAPI + SQLite
- Frontend: React (CRA)
- Auth: JWT

## Быстрый запуск обоих сервисов
В корне:
```bash
python -m venv backend/.venv
# Windows PowerShell
backend/.venv/Scripts/Activate.ps1
# Устанавливаем зависимости
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm ci
cd ..

# Старт фронта и бэка одновременно
python run_all.py
```
Frontend: http://localhost:3000  
Backend: http://127.0.0.1:8000  
Остановка: `Ctrl+C` в том же окне — скрипт корректно гасит оба процесса.

> Если путь к проекту содержит `!` (например `D:\Projects!\...`), CRA/webpack падает. Используйте подстановочный диск:
> ```powershell
> subst K: "D:\Projects!\sharaje\Kursovaya\frontend"
> cd K:\
> npm start
> ```

## Запуск по отдельности
- Backend:
  ```bash
  cd backend
  uvicorn app.main:app --reload
  ```
- Frontend:
  ```bash
  cd frontend
  npm start
  ```

## Роли и доступ
- Роли: `admin`, `ceo`, `manager`, `employee`.
- Создание задач доступно ролям `admin`, `ceo`, `manager`.
- Регистрация новых пользователей доступна только `admin` и `ceo`.

### Регистрация пользователя (только admin/ceo)
`POST /auth/register` с заголовком `Authorization: Bearer <token>`  
Тело:
```json
{
  "username": "new_user",
  "password": "secret",
  "role": "employee"   // admin | ceo | manager | employee
}
```

### Логин
`POST /auth/login` → `{"access_token": "..."}`

## Статусы доски
При первом запуске автоматически создаются: `сделать`, `в работе`, `на проверке`, `готово`.

## UI
- Доска с drag & drop по статусам.
- Форма создания задач по умолчанию свернута; доступна кнопкой «Новая задача» (видна только admin/ceo/manager).
- Карточка и детали задачи показывают исполнителя.
- Страница `/users` содержит список всех пользователей и их ролей.
