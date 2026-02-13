"""Reset SQLite и наполнение демо-данными (пользователи, задачи, чат)."""
from pathlib import Path
from datetime import datetime, timedelta
import random

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
    ]
    # добавим пачку сотрудников
    for i in range(1, 21):
        users.append((f"employee{i}", f"emp{i:03}", "employee"))
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
    titles = [
        "Настроить канбан",
        "Подключить чат",
        "UI: список пользователей",
        "Документация",
        "Рефакторинг API",
        "Починить drag&drop",
        "Добавить сортировку",
        "Фикс авторизации",
        "Интеграция туннеля",
        "Тестирование ролей",
        "Seed demo data",
        "Градиент фона",
        "Редактирование задачи",
        "Список пространств",
        "Оптимизация запросов",
        "Деплой preview",
        "Локализация",
        "Добавить метки",
        "Починить CORS",
        "Таблица пользователей",
        "Форма создания",
        "Обновление паролей",
        "Роли и доступ",
        "Докеризация",
    ]

    tasks = []
    for i, title in enumerate(titles, start=1):
        creator = random.choice(["admin", "ceo", "manager"])
        # иногда без исполнителя, иногда любой сотрудник
        assignee_choice = random.choice(list(u.keys()) + [None])
        status_name = random.choice(["сделать", "в работе", "на проверке", "готово"])
        task = Task(
            title=title,
            short_description=random.choice(
                ["Коротко про задачу", "Проверить", "Срочно", "Нормальный приоритет", "Нужно обсудить"]
            ),
            description=f"{title}. Детали: auto-generated seed.",
            status_id=status_by_name[status_name].id,
            created_by=u[creator].id,
            assignee_id=u[assignee_choice].id if assignee_choice else None,
            created_at=now - timedelta(hours=random.randint(1, 120)),
        )
        session.add(task)
        tasks.append(task)
    session.commit()
    return tasks


def seed_messages(session, tasks, users):
    u = {usr.username: usr for usr in users}
    sample_texts = [
        "Проверь, пожалуйста.",
        "Сделано, жду ревью.",
        "Нужна сортировка по роли.",
        "Добавил, посмотри.",
        "Встреча в 15:00.",
        "Починил drag&drop.",
        "Добавил автообновление чата.",
        "Поменял фон, посмотри градиент.",
        "Готово к деплою.",
        "Нужен ещё один статус?",
        "Подправил CORS.",
        "Обновил README.",
        "Сделал сиды.",
        "Проверил роли.",
    ]

    for task in tasks:
        msg_count = random.randint(5, 20)
        for _ in range(msg_count):
            author = random.choice(list(u.values()))
            text = random.choice(sample_texts)
            session.add(
                Message(
                    content=text,
                    task_id=task.id,
                    user_id=author.id,
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
