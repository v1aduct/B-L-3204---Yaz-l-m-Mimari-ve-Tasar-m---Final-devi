from src.domain.interfaces import IObserver

class User(IObserver):
    def __init__(self, user_id: str, name: str, email: str, phone: str, role: str, preferences: list[str] = None):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.phone = phone
        self.role = role  # "student" or "teacher"
        self.preferences = preferences if preferences is not None else ["email", "sms"]
        self.notifications_received = []

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "preferences": self.preferences,
            "notifications_received": self.notifications_received
        }

class Student(User):
    def __init__(self, user_id: str, name: str, email: str, phone: str, department: str = "Computer Engineering", preferences: list[str] = None):
        super().__init__(user_id, name, email, phone, role="student", preferences=preferences)
        self.department = department

    def update(self, announcement) -> None:
        notification_info = {
            "announcement_id": announcement.announcement_id,
            "title": announcement.title,
            "content": announcement.content,
            "type": announcement.announcement_type,
            "received_at": announcement.created_at
        }
        self.notifications_received.append(notification_info)

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["department"] = self.department
        return data

class Teacher(User):
    def __init__(self, user_id: str, name: str, email: str, phone: str, office: str = "Room 302", preferences: list[str] = None):
        super().__init__(user_id, name, email, phone, role="teacher", preferences=preferences)
        self.office = office

    def update(self, announcement) -> None:
        notification_info = {
            "announcement_id": announcement.announcement_id,
            "title": announcement.title,
            "content": announcement.content,
            "type": announcement.announcement_type,
            "received_at": announcement.created_at
        }
        self.notifications_received.append(notification_info)

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["office"] = self.office
        return data
