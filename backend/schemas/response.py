from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T")


class Pagination(BaseModel):
    page: int
    page_size: int
    total_rows: int


class SingleResponse(BaseModel, Generic[T]):
    msg: str = "success"
    request_id: str
    data: T


class ListResponse(BaseModel, Generic[T]):
    msg: str = "success"
    request_id: str
    data: list[T]
    pagination: Pagination


class ErrorResponse(BaseModel):
    msg: str
    request_id: str


class ReorderItem(BaseModel):
    id: UUID
    sort_order: int
