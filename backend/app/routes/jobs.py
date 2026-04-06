from fastapi import APIRouter, HTTPException
from app.utils.task_registry import get_task, cleanup_old_tasks

router = APIRouter(prefix="/jobs")

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    """
    Returns the status and progress of a background job.
    Also triggers a background cleanup of stale tasks.
    """
    # 🧹 Periodic cleanup check (could be moved to a cleaner mechanism, but this is fine for now)
    cleanup_old_tasks()
    
    task = get_task(job_id)
    if not task:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job_id,
        "status": task["status"],
        "progress": task["progress"],
        "message": task["message"],
        "error_message": task["error_message"],
        "result": task["result"] if task["status"] == "completed" else None
    }
