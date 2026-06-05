import sys
import os
import unittest

# Ensure the src folder is in the path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.domain.entities import Student, Teacher
from src.domain.announcements import ExamAnnouncement, EventAnnouncement
from src.infrastructure.factories import AnnouncementFactory, NotificationFactory
from src.infrastructure.notifications import EmailNotification, SMSNotification
from src.application.singletons import Logger
from src.application.services import AnnouncementPublisher

class TestCampusPatterns(unittest.TestCase):

    def setUp(self):
        # Clear logger and notification repository before each test
        Logger().clear()
        from src.infrastructure.repository import notification_history_repo, user_repository
        notification_history_repo.clear()
        
        # Clear all user repository entries
        for user in list(user_repository.get_all()):
            user_repository.delete(user.user_id)

    def test_singleton_logger(self):
        """Verify that Logger is a Singleton and thread-safe."""
        log1 = Logger()
        log2 = Logger()
        
        self.assertIs(log1, log2, "Logger instances are not the same! Singleton pattern failed.")
        
        log1.log("Testing Singleton")
        self.assertEqual(len(log2.get_logs()), 1, "Logs should be shared across references.")
        self.assertEqual(log2.get_logs()[0]["message"], "Testing Singleton")

    def test_factory_announcement(self):
        """Verify that AnnouncementFactory returns correct concrete classes."""
        exam = AnnouncementFactory.create_announcement(
            announcement_type="exam",
            announcement_id="test-1",
            title="Math Exam",
            content="Math exam details",
            course_code="MATH-101",
            exam_date="2026-06-25"
        )
        self.assertIsInstance(exam, ExamAnnouncement)
        self.assertEqual(exam.course_code, "MATH-101")
        
        event = AnnouncementFactory.create_announcement(
            announcement_type="event",
            announcement_id="test-2",
            title="Music Fest",
            content="Campus music festival",
            event_location="Garden",
            event_time="2026-06-30"
        )
        self.assertIsInstance(event, EventAnnouncement)
        self.assertEqual(event.event_location, "Garden")

    def test_factory_notification(self):
        """Verify that NotificationFactory returns correct notification channel objects."""
        student = Student("usr-test", "Ali", "ali@edu.tr", "+90555")
        
        email_notif = NotificationFactory.create_notification("email", student, "Hello Ali")
        self.assertIsInstance(email_notif, EmailNotification)
        
        sms_notif = NotificationFactory.create_notification("sms", student, "Hello Ali")
        self.assertIsInstance(sms_notif, SMSNotification)

    def test_observer_pattern(self):
        """Verify that publisher notifies observers correctly on publish."""
        publisher = AnnouncementPublisher()
        student = Student("usr-s1", "Ahmet", "ahmet@edu.tr", "+90555", "Computer Eng", ["email"])
        teacher = Teacher("usr-t1", "Mehmet", "mehmet@edu.tr", "+90555", "Room 101", ["sms"])
        
        publisher.attach(student)
        publisher.attach(teacher)
        
        # Create an announcement
        ann = AnnouncementFactory.create_announcement(
            announcement_type="exam",
            announcement_id="ann-test",
            title="Final Exam",
            content="Final details",
            course_code="CENG-201",
            exam_date="2026-06-20"
        )
        
        publisher.notify(ann)
        
        # Check that observers received updates in their records
        self.assertEqual(len(student.notifications_received), 1)
        self.assertEqual(student.notifications_received[0]["title"], "Final Exam")
        self.assertEqual(len(teacher.notifications_received), 1)
        self.assertEqual(teacher.notifications_received[0]["title"], "Final Exam")
        
        # Check history has notifications sent
        from src.infrastructure.repository import notification_history_repo
        history = notification_history_repo.get_all()
        
        # Ahmet gets email, Mehmet gets sms
        self.assertEqual(len(history), 2)
        channels = [h["channel"] for h in history]
        self.assertIn("email", channels)
        self.assertIn("sms", channels)

if __name__ == '__main__':
    unittest.main()
