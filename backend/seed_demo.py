"""Reset SQLite и наполнение демо-данными (пользователи, задачи, чат)."""
from pathlib import Path
from datetime import datetime, timedelta

from app.db.base import Base
from app.db.session import engine, SessionLocal, DATABASE_URL
from app.models.user import User
from app.models.status import Status
from app.models.task import Task
from app.models.message import Message
from app.core.security import hash_password


DB_FILE = Path(DATABASE_URL.replace("sqlite:///", "./"))


def reset_db():
    # Удаляем файл SQLite, создаём заново схему
    if DB_FILE.exists():
        DB_FILE.unlink()
    Base.metadata.create_all(bind=engine)


def seed_statuses(session):
    statuses = [
        ("сделать", 1),
        ("в работе", 2),
        ("на проверке", 3),
        ("готово", 4),
    ]
    for name, order_index in statuses:
        session.add(Status(name=name, order_index=order_index))
    session.commit()


def seed_users(session):
    users = [
        ("admin", "admin123", "admin"),
        ("ceo", "ceo123", "ceo"),
        ("manager", "manager123", "manager"),
        ("employee1", "emp123", "employee"),
        ("employee2", "emp456", "employee"),
    ]
    created = []
    for username, password, role in users:
        user = User(
            username=username,
            password_hash=hash_password(password),
            password_plain=password,
            role=role,
        )
        session.add(user)
        created.append(user)
    session.commit()
    session.refresh(created[0])
    return created


def seed_tasks(session, users):
    status_by_name = {s.name: s for s in session.query(Status).all()}
    u = {usr.username: usr for usr in users}

    now = datetime.utcnow()
    tasks_data = [
        {
            "title": "Настроить канбан",
            "short": "Базовая доска и колонки",
            "desc": "Создать колонки и проверить dnd.",
            "status": "сделать",
            "creator": "manager",
            "assignee": "manager",
            "created_at": now - timedelta(days=2),
        },
        {
            "title": "Подключить чат",
            "short": "Messages API",
            "desc": "Проверить отправку и чтение сообщений.",
            "status": "в работе",
            "creator": "manager",
            "assignee": "employee1",
            "created_at": now - timedelta(days=1),
        },
        {
            "title": "UI: список пользователей",
            "short": "Таблица + сортировка",
            "desc": "Сделать таблицу с ролями и паролями.",
            "status": "на проверке",
            "creator": "ceo",
            "assignee": "employee2",
            "created_at": now - timedelta(hours=12),
        },
        {
            "title": "Документация",
            "short": "PROJEKT.md",
            "desc": "Собрать описание проекта.",
            "status": "готово",
            "creator": "admin",
            "assignee": "admin",
            "created_at": now - timedelta(days=3),
        },
        {
            "title": "Общие задачи",
            "short": "Нет исполнителя",
            "desc": "Любой может взять.",
            "status": "сделать",
            "creator": "manager",
            "assignee": None,
            "created_at": now - timedelta(hours=6),
        },
    ]

    tasks = []
    for t in tasks_data:
        task = Task(
            title=t["title"],
            short_description=t["short"],
            description=t["desc"],
            status_id=status_by_name[t["status"]].id,
            created_by=u[t["creator"]].id,
            assignee_id=u[t["assignee"]].id if t["assignee"] else None,
            created_at=t["created_at"],
        )
        session.add(task)
        tasks.append(task)
    session.commit()
    return tasks


def seed_messages(session, tasks, users):
    u = {usr.username: usr for usr in users}
    messages = [
        ("manager", tasks[0], "Собрал колонки, осталось стили доделать."),
        ("employee1", tasks[1], "Я подключил чат, проверь, пожалуйста."),
        ("manager", tasks[1], "Принял, сейчас протестирую."),
        ("ceo", tasks[2], "Нужна сортировка по роли, добавьте."),
        ("employee2", tasks[2], "Добавил сортировку, посмотри."),
    ]
    for username, task, content in messages:
        session.add(
            Message(
                content=content,
                task_id=task.id,
                user_id=u[username].id,
            )
        )
    session.commit()


def main():
    reset_db()
    session = SessionLocal()
    try:
        seed_statuses(session)
        users = seed_users(session)
        tasks = seed_tasks(session, users)
        seed_messages(session, tasks, users)
        print("Демо-данные записаны.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
