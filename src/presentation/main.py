import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.presentation.routes import router as api_router
from src.domain.entities import Student, Teacher
from src.application.services import announcement_service
from src.application.singletons import Logger

app = FastAPI(
    title="Akıllı Kampüs Duyuru ve Bildirim Yönetim Sistemi",
    description="Observer, Factory, and Singleton Design Patterns demonstrated in a 4-Layer DDD architecture.",
    version="1.0.0"
)

# CORS configuration to allow local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(api_router, prefix="/api")

# Seed initial data
def seed_data():
    Logger().log("Seeding initial campus data...")
    
    # Students
    s1 = Student("usr-s1", "Ahmet Yılmaz", "ahmet.yilmaz@edu.tr", "+905551112233", "Computer Engineering", ["email", "sms"])
    s2 = Student("usr-s2", "Ayşe Demir", "ayse.demir@edu.tr", "+905552223344", "Electrical Engineering", ["email"])
    s3 = Student("usr-s3", "Can Boz", "can.boz@edu.tr", "+905553334455", "Industrial Engineering", ["sms"])
    
    # Teachers
    t1 = Teacher("usr-t1", "Prof. Dr. Mehmet Kaya", "mehmet.kaya@edu.tr", "+905554445566", "Room 302", ["email", "sms"])
    t2 = Teacher("usr-t2", "Doç. Dr. Elif Şahin", "elif.sahin@edu.tr", "+905555556677", "Room 415", ["email"])
    
    announcement_service.register_user(s1)
    announcement_service.register_user(s2)
    announcement_service.register_user(s3)
    announcement_service.register_user(t1)
    announcement_service.register_user(t2)
    
    # Create initial announcements
    announcement_service.publish_new_announcement(
        announcement_type="exam",
        title="CENG 101 Midterm Exam",
        content="The CENG 101 Midterm Exam will be held in Hall A and Hall B. Please make sure to be there 15 minutes before.",
        course_code="CENG 101",
        exam_date="2026-06-18 10:00"
    )
    
    announcement_service.publish_new_announcement(
        announcement_type="event",
        title="AI Seminar: Future of Tech",
        content="Join us for a seminar on Advanced Agentic AI and Antigravity systems in the Main Auditorium.",
        event_location="Main Campus Hall 1",
        event_time="2026-06-10 14:00"
    )
    
    Logger().log("Seeding completed successfully.")

@app.on_event("startup")
def startup_event():
    seed_data()

# Serve static frontend files if directory exists
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    def read_root():
        return {
            "message": "Welcome to Smart Campus API. Static frontend build not found. Please run Vite dev server in the frontend directory."
        }
