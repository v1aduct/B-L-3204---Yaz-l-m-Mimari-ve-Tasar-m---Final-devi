from abc import ABC
from datetime import datetime

class Announcement(ABC):
    def __init__(self, announcement_id: str, title: str, content: str, announcement_type: str):
        self.announcement_id = announcement_id
        self.title = title
        self.content = content
        self.announcement_type = announcement_type
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self) -> dict:
        return {
            "announcement_id": self.announcement_id,
            "title": self.title,
            "content": self.content,
            "announcement_type": self.announcement_type,
            "created_at": self.created_at
        }

class ExamAnnouncement(Announcement):
    def __init__(self, announcement_id: str, title: str, content: str, course_code: str, exam_date: str):
        super().__init__(announcement_id, title, content, announcement_type="exam")
        self.course_code = course_code
        self.exam_date = exam_date

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["course_code"] = self.course_code
        data["exam_date"] = self.exam_date
        return data

class EventAnnouncement(Announcement):
    def __init__(self, announcement_id: str, title: str, content: str, event_location: str, event_time: str):
        super().__init__(announcement_id, title, content, announcement_type="event")
        self.event_location = event_location
        self.event_time = event_time

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["event_location"] = self.event_location
        data["event_time"] = self.event_time
        return data
