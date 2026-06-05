import uuid
from src.domain.interfaces import ISubject, IObserver
from src.infrastructure.factories import AnnouncementFactory, NotificationFactory
from src.application.singletons import Logger
from src.infrastructure.repository import user_repository

class AnnouncementPublisher(ISubject):
    def __init__(self):
        self._observers = []

    def attach(self, observer: IObserver) -> None:
        if observer not in self._observers:
            self._observers.append(observer)
            Logger().log(f"Attached observer: {observer.name} ({observer.role})")

    def detach(self, observer: IObserver) -> None:
        if observer in self._observers:
            self._observers.remove(observer)
            Logger().log(f"Detached observer: {observer.name} ({observer.role})")

    def notify(self, announcement) -> None:
        Logger().log(f"Publishing announcement: '{announcement.title}' ({announcement.announcement_type}) to {len(self._observers)} observers.")
        for observer in self._observers:
            observer.update(announcement)
            
            # Send notifications through preferred channels (Email, SMS)
            for channel in observer.preferences:
                try:
                    msg = f"New {announcement.announcement_type} announcement: {announcement.title}. {announcement.content}"
                    notification = NotificationFactory.create_notification(channel, observer, msg)
                    notification.send()
                except Exception as e:
                    Logger().log(f"Error sending {channel} notification to {observer.name}: {str(e)}")

class AnnouncementService:
    def __init__(self, publisher: AnnouncementPublisher):
        self._publisher = publisher
        self._announcements = []

    def register_user(self, user) -> None:
        user_repository.add(user)
        self._publisher.attach(user)

    def remove_user(self, user_id: str) -> bool:
        user = user_repository.get(user_id)
        if user:
            self._publisher.detach(user)
            user_repository.delete(user_id)
            return True
        return False

    def publish_new_announcement(self, announcement_type: str, title: str, content: str, **kwargs):
        announcement_id = f"ann-{str(uuid.uuid4())[:8]}"
        
        # Create announcement using Factory Pattern
        announcement = AnnouncementFactory.create_announcement(
            announcement_type=announcement_type,
            announcement_id=announcement_id,
            title=title,
            content=content,
            **kwargs
        )
        
        self._announcements.append(announcement)
        
        # Notify via Observer Pattern
        self._publisher.notify(announcement)
        return announcement

    def get_announcements(self) -> list:
        return self._announcements

# Instantiate shared publisher and service for the app
shared_publisher = AnnouncementPublisher()
announcement_service = AnnouncementService(shared_publisher)
