from abc import ABC, abstractmethod

class INotification(ABC):
    @abstractmethod
    def send(self) -> None:
        """Sends the notification via the specific channel."""
        pass

class IObserver(ABC):
    @abstractmethod
    def update(self, announcement) -> None:
        """Receives updates from the subject (publisher)."""
        pass

class ISubject(ABC):
    @abstractmethod
    def attach(self, observer: IObserver) -> None:
        """Attaches an observer to the subject."""
        pass

    @abstractmethod
    def detach(self, observer: IObserver) -> None:
        """Detaches an observer from the subject."""
        pass

    @abstractmethod
    def notify(self, announcement) -> None:
        """Notifies all observers about an announcement."""
        pass
