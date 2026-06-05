from src.domain.announcements import Announcement, ExamAnnouncement, EventAnnouncement
from src.domain.interfaces import INotification
from src.infrastructure.notifications import EmailNotification, SMSNotification

class AnnouncementFactory:
    @staticmethod
    def create_announcement(announcement_type: str, announcement_id: str, title: str, content: str, **kwargs) -> Announcement:
        ann_type_lower = announcement_type.lower()
        if ann_type_lower == "exam":
            course_code = kwargs.get("course_code", "GEN-101")
            exam_date = kwargs.get("exam_date", "TBD")
            return ExamAnnouncement(
                announcement_id=announcement_id,
                title=title,
                content=content,
                course_code=course_code,
                exam_date=exam_date
            )
        elif ann_type_lower == "event":
            event_location = kwargs.get("event_location", "Main Campus")
            event_time = kwargs.get("event_time", "TBD")
            return EventAnnouncement(
                announcement_id=announcement_id,
                title=title,
                content=content,
                event_location=event_location,
                event_time=event_time
            )
        else:
            raise ValueError(f"Unknown announcement type: {announcement_type}")

class NotificationFactory:
    @staticmethod
    def create_notification(channel: str, recipient, message: str) -> INotification:
        channel_lower = channel.lower()
        if channel_lower == "email":
            return EmailNotification(recipient, message)
        elif channel_lower == "sms":
            return SMSNotification(recipient, message)
        else:
            raise ValueError(f"Unknown notification channel: {channel}")
