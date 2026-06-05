from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from src.domain.entities import Student, Teacher
from src.application.services import announcement_service
from src.infrastructure.repository import user_repository, notification_history_repo
from src.application.singletons import Logger

router = APIRouter()

class UserCreateRequest(BaseModel):
    name: str
    email: str
    phone: str
    role: str = Field(..., description="student or teacher")
    preferences: List[str] = Field(default=["email", "sms"])
    department: Optional[str] = "Computer Engineering"
    office: Optional[str] = "Room 302"

class AnnouncementCreateRequest(BaseModel):
    announcement_type: str = Field(..., description="exam or event")
    title: str
    content: str
    course_code: Optional[str] = None
    exam_date: Optional[str] = None
    event_location: Optional[str] = None
    event_time: Optional[str] = None

@router.get("/users")
def get_users():
    return [u.to_dict() for u in user_repository.get_all()]

@router.post("/users")
def create_user(req: UserCreateRequest):
    import uuid
    user_id = f"usr-{str(uuid.uuid4())[:8]}"
    if req.role.lower() == "student":
        user = Student(
            user_id=user_id,
            name=req.name,
            email=req.email,
            phone=req.phone,
            department=req.department or "Computer Engineering",
            preferences=req.preferences
        )
    elif req.role.lower() == "teacher":
        user = Teacher(
            user_id=user_id,
            name=req.name,
            email=req.email,
            phone=req.phone,
            office=req.office or "Room 302",
            preferences=req.preferences
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student' or 'teacher'")

    announcement_service.register_user(user)
    return user.to_dict()

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    success = announcement_service.remove_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": f"User {user_id} removed"}

@router.get("/announcements")
def get_announcements():
    return [a.to_dict() for a in announcement_service.get_announcements()]

@router.post("/announcements")
def create_announcement(req: AnnouncementCreateRequest):
    kwargs = {}
    if req.announcement_type.lower() == "exam":
        if req.course_code: kwargs["course_code"] = req.course_code
        if req.exam_date: kwargs["exam_date"] = req.exam_date
    elif req.announcement_type.lower() == "event":
        if req.event_location: kwargs["event_location"] = req.event_location
        if req.event_time: kwargs["event_time"] = req.event_time
    else:
        raise HTTPException(status_code=400, detail="Invalid announcement type")

    try:
        ann = announcement_service.publish_new_announcement(
            announcement_type=req.announcement_type,
            title=req.title,
            content=req.content,
            **kwargs
        )
        return ann.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications")
def get_notifications():
    return notification_history_repo.get_all()

@router.get("/logs")
def get_logs():
    return Logger().get_logs()

@router.post("/notifications/clear")
def clear_notifications():
    notification_history_repo.clear()
    Logger().log("Notification delivery history cleared.")
    return {"status": "success", "message": "Notification history cleared"}

@router.post("/logs/clear")
def clear_logs():
    Logger().clear()
    Logger().log("System logs cleared.")
    return {"status": "success", "message": "System logs cleared"}

@router.post("/reset")
def reset_system():
    # Clear history, logs and remove users
    notification_history_repo.clear()
    Logger().clear()
    
    # Detach all current observers
    for u in list(user_repository.get_all()):
        announcement_service.remove_user(u.user_id)
        
    Logger().log("System database and logs reset.")
    return {"status": "success", "message": "System database and logs reset"}
