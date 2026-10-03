from pydantic import BaseModel, Field


class Experience(BaseModel):
    company: str
    role: str
    description: str


class Project(BaseModel):
    name: str
    technologies: list[str]
    description: str


class CandidateProfile(BaseModel):
    name: str
    target_roles: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)