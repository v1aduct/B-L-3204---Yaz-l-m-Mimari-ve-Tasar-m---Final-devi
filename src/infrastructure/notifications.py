from src.domain.interfaces import INotification
from src.domain.entities import User

class EmailNotification(INotification):
    def __init__(self, recipient: User, message: str):
        self.recipient = recipient
        self.message = message

    def send(self) -> None:
        from src.application.singletons import Logger
        from src.infrastructure.repository import notification_history_repo
        
        output = f"[EMAIL] Sending to {self.recipient.email}: {self.message}"
        print(output)
        
        # Log to the Singleton Logger
        logger = Logger()
        logger.log(f"EMAIL sent to {self.recipient.name} ({self.recipient.email}): {self.message}")
        
        # Add to history
        notification_history_repo.add({
            "channel": "email",
            "recipient_name": self.recipient.name,
            "recipient_role": self.recipient.role,
            "address": self.recipient.email,
            "message": self.message,
            "status": "sent"
        })

class SMSNotification(INotification):
    def __init__(self, recipient: User, message: str):
        self.recipient = recipient
        self.message = message

    def send(self) -> None:
        from src.application.singletons import Logger
        from src.infrastructure.repository import notification_history_repo
        
        output = f"[SMS] Sending to {self.recipient.phone}: {self.message}"
        print(output)
        
        # Log to the Singleton Logger
        logger = Logger()
        logger.log(f"SMS sent to {self.recipient.name} ({self.recipient.phone}): {self.message}")
        
        # Add to history
        notification_history_repo.add({
            "channel": "sms",
            "recipient_name": self.recipient.name,
            "recipient_role": self.recipient.role,
            "address": self.recipient.phone,
            "message": self.message,
            "status": "sent"
        })
