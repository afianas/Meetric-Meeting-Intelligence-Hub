from pydantic import BaseModel, Field
from typing import List, Optional

class TranscriptSegment(BaseModel):
    speaker: str = Field(..., description="Speaker name (e.g. Dharvick or Speaker 1)")
    role: str = Field(default="Participant", description="Inferred role (e.g. Developer, Manager)")
    text: str = Field(..., description="The transcript content for this turn")
    emotion: Optional[str] = Field(default="neutral", description="Detected emotion category")
    timestamp: float = Field(default=0.0, description="Start time in seconds")

class ActionItemSchema(BaseModel):
    id: int
    who: str = Field(default="Unassigned")
    task: str
    deadline: Optional[str] = Field(default=None)
    status: str = Field(default="pending")
    completed: bool = Field(default=False)

class MeetingAnalysisSchema(BaseModel):
    meeting_name: Optional[str] = None
    decisions: List[str] = Field(default_factory=list)
    action_items: List[ActionItemSchema] = Field(default_factory=list)
