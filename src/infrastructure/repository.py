from datetime import datetime

class InMemoryUserRepository:
    def __init__(self):
        self._users = {}

    def add(self, user) -> None:
        self._users[user.user_id] = user

    def get(self, user_id) -> None:
        return self._users.get(user_id)

    def get_all(self) -> list:
        return list(self._users.values())

    def delete(self, user_id) -> bool:
        if user_id in self._users:
            del self._users[user_id]
            return True
        return False

class InMemoryNotificationHistory:
    def __init__(self):
        self._history = []

    def add(self, record: dict) -> None:
        record["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._history.append(record)

    def get_all(self) -> list:
        return self._history

    def clear(self) -> None:
        self._history.clear()

user_repository = InMemoryUserRepository()
notification_history_repo = InMemoryNotificationHistory()
