from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class SkillRequirement(BaseModel):
    name: str
    requirement: Optional[str] = "REQUIRED"  # REQUIRED or PREFERRED
    weight: Optional[float] = 1.0

class ListingAnalyzeRequest(BaseModel):
    title: str
    description: str
    skills: Optional[List[SkillRequirement]] = []
    location: Optional[str] = None
    availabilityRequired: Optional[str] = "FULL_TIME"
    seniority: Optional[str] = "ANY"
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None

class BudgetInfo(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    currency: str = "ETB"

class ListingAnalyzeResponse(BaseModel):
    requiredSkills: List[str] = []
    preferredSkills: List[str] = []
    seniority: str = "ANY"
    location: Optional[str] = None
    availability: str = "FULL_TIME"
    budget: BudgetInfo

class ProfileAnalyzeRequest(BaseModel):
    profileText: str

class ExtractedSkill(BaseModel):
    name: str
    confidence: float

class ProfileAnalyzeResponse(BaseModel):
    skills: List[ExtractedSkill] = []
    yearsExperience: int = 0

# Match models
class ListingSkillDto(BaseModel):
    name: str
    requirement: Optional[str] = "REQUIRED"
    weight: Optional[float] = 1.0

class ListingDto(BaseModel):
    id: str
    title: str
    description: str
    skills: Optional[List[ListingSkillDto]] = []
    locationId: Optional[int] = None
    isRemote: Optional[bool] = False
    availabilityRequired: Optional[str] = "FULL_TIME"
    seniority: Optional[str] = "ANY"
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None

class CandidateSkillDto(BaseModel):
    name: str
    proficiency: Optional[int] = 3
    yearsExperience: Optional[float] = 1.0

class CandidateDto(BaseModel):
    providerProfileId: str
    text: Optional[str] = ""
    displayName: Optional[str] = None
    skills: Optional[List[CandidateSkillDto]] = []
    yearsExperience: Optional[int] = 0
    locationId: Optional[int] = None
    availability: Optional[str] = "FULL_TIME"
    hourlyRate: Optional[float] = None
    categoryFocus: Optional[str] = "ANY"

class MatchOptions(BaseModel):
    explain: Optional[bool] = True

class MatchRequest(BaseModel):
    listing: ListingDto
    candidates: List[CandidateDto]
    k: Optional[int] = 5
    options: Optional[MatchOptions] = Field(default_factory=MatchOptions)

class Factor(BaseModel):
    name: str
    value: Union[str, float, int]
    weight: float
    contribution: float
    detail: str

class Explanation(BaseModel):
    summary: str
    factors: List[Factor]

class MatchCandidateResult(BaseModel):
    providerProfileId: str
    rank: int
    score: float
    displayName: Optional[str] = None
    explanation: Optional[Explanation] = None

class MatchResponse(BaseModel):
    model: str
    modelVersion: str
    latencyMs: int
    results: List[MatchCandidateResult]
