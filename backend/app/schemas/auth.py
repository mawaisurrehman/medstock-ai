"""Authentication schemas."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class UserInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    facility: str = ""


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    email: str
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    access_token: str
    token_type: str = "bearer"
    user: UserInfo
