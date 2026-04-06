import time
import logging
from typing import Dict, Optional, Any
from datetime import datetime

logger = logging.getLogger("app.task_registry")

# In-memory storage for task statuses
# Structure: { job_id: { status, progress, message, error_message, result, created_at, updated_at } }
TASKS: Dict[str, Dict[str, Any]] = {}

def get_now() -> float:
    return time.time()

def init_task(job_id: str):
    """Initializes a new task in the registry."""
    now = get_now()
    TASKS[job_id] = {
        "status": "queued",
        "progress": 0,
        "message": "Initializing...",
        "error_message": None,
        "result": None,
        "created_at": now,
        "updated_at": now
    }
    logger.info(f"🆕 Task Initialized: {job_id}")

def update_task(job_id: str, status: Optional[str] = None, progress: Optional[int] = None, 
                message: Optional[str] = None, error_message: Optional[str] = None, 
                result: Optional[Any] = None):
    """Updates an existing task in the registry."""
    if job_id not in TASKS:
        logger.warning(f"⚠️ Attempted to update non-existent task: {job_id}")
        return

    task = TASKS[job_id]
    if status: task["status"] = status
    if progress is not None: task["progress"] = progress
    if message: task["message"] = message
    if error_message: task["error_message"] = error_message
    if result is not None: task["result"] = result
    
    task["updated_at"] = get_now()
    
    # Log significant updates
    if status == "failed":
        logger.error(f"❌ Task Failed [{job_id}]: {error_message}")
    elif status == "completed":
        duration = task["updated_at"] - task["created_at"]
        logger.info(f"✅ Task Completed [{job_id}] in {duration:.2f}s")
    else:
        logger.debug(f"🔄 Task Updated [{job_id}]: {status} - {progress}% - {message}")

def get_task(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a task from the registry."""
    return TASKS.get(job_id)

def cleanup_old_tasks(max_age_seconds: int = 600):
    """Removes tasks older than max_age_seconds."""
    now = get_now()
    to_delete = []
    for job_id, task in TASKS.items():
        # Only cleanup finished tasks
        if task["status"] in ["completed", "failed"]:
            if now - task["updated_at"] > max_age_seconds:
                to_delete.append(job_id)
    
    for job_id in to_delete:
        del TASKS[job_id]
        logger.info(f"🧹 Cleaned up old task: {job_id}")
