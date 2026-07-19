from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.commitment import CommitmentCreate, CommitmentUpdate, CommitmentRead
from schemas.record import RecordCreate, RecordUpdate, RecordRead, RecordBatchCreate
from schemas.daily import DailyResponse, DailyHabitCheckin
from schemas.response import SingleResponse, ListResponse, Pagination
from services.commitment_service import CommitmentService
from services.record_service import RecordService
from services.progress_service import ProgressService

router = APIRouter(tags=["pursuits"])

USER_ID = 1

@router.get("/api/v1/pursuits/commitments", response_model=ListResponse[CommitmentRead])
async def list_commitments(
    request: Request,
    type: str | None = Query(None),
    status: str | None = Query(None),
    parent_id: UUID | None = Query(None),
    root: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    commitments = await CommitmentService.list_commitments(db, USER_ID, type_=type, status=status, parent_id=parent_id, root=root)
    # Calculate progress for each
    for c in commitments:
        c.progress = await ProgressService.compute_progress(db, c)
    
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(commitments), total_rows=len(commitments))
    return ListResponse(request_id=request_id, data=commitments, pagination=pagination)

@router.post("/api/v1/pursuits/commitments", response_model=SingleResponse[CommitmentRead], status_code=status.HTTP_201_CREATED)
async def create_commitment(
    request: Request,
    data: CommitmentCreate,
    db: AsyncSession = Depends(get_db)
):
    commitment = await CommitmentService.create_commitment(db, USER_ID, data)
    commitment.progress = await ProgressService.compute_progress(db, commitment)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=commitment)

@router.get("/api/v1/pursuits/commitments/{commitment_id}", response_model=SingleResponse[CommitmentRead])
async def get_commitment(
    request: Request,
    commitment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    commitment = await CommitmentService.get_commitment(db, commitment_id, USER_ID)
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    commitment.progress = await ProgressService.compute_progress(db, commitment)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=commitment)

@router.put("/api/v1/pursuits/commitments/{commitment_id}", response_model=SingleResponse[CommitmentRead])
async def update_commitment(
    request: Request,
    commitment_id: UUID,
    data: CommitmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    commitment = await CommitmentService.update_commitment(db, commitment_id, USER_ID, data)
    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")
    commitment.progress = await ProgressService.compute_progress(db, commitment)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=commitment)

@router.delete("/api/v1/pursuits/commitments/{commitment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_commitment(
    commitment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    ok = await CommitmentService.delete_commitment(db, commitment_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=404, detail="Commitment not found")

@router.get("/api/v1/pursuits/records", response_model=ListResponse[RecordRead])
async def list_records(
    request: Request,
    commitment_id: UUID | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    records = await RecordService.get_records(db, commitment_id=commitment_id, date_from=date_from, date_to=date_to, status=status)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(records), total_rows=len(records))
    return ListResponse(request_id=request_id, data=records, pagination=pagination)

@router.post("/api/v1/pursuits/records", response_model=SingleResponse[RecordRead], status_code=status.HTTP_201_CREATED)
async def create_record(
    request: Request,
    data: RecordCreate,
    db: AsyncSession = Depends(get_db)
):
    record = await RecordService.create_record(db, data)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=record)

@router.post("/api/v1/pursuits/records/batch", response_model=ListResponse[RecordRead], status_code=status.HTTP_201_CREATED)
async def batch_create_records(
    request: Request,
    data: RecordBatchCreate,
    db: AsyncSession = Depends(get_db)
):
    records = await RecordService.batch_create_records(db, data.records)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(records), total_rows=len(records))
    return ListResponse(request_id=request_id, data=records, pagination=pagination)

@router.get("/api/v1/pursuits/records/{record_id}", response_model=SingleResponse[RecordRead])
async def get_record(
    request: Request,
    record_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    record = await RecordService.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=record)

@router.put("/api/v1/pursuits/records/{record_id}", response_model=SingleResponse[RecordRead])
async def update_record(
    request: Request,
    record_id: UUID,
    data: RecordUpdate,
    db: AsyncSession = Depends(get_db)
):
    record = await RecordService.update_record(db, record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=record)

@router.delete("/api/v1/pursuits/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    ok = await RecordService.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Record not found")

@router.get("/api/v1/pursuits/daily/{target_date}", response_model=SingleResponse[DailyResponse])
async def get_daily(
    request: Request,
    target_date: date,
    db: AsyncSession = Depends(get_db)
):
    # 1. Active habits and today's record
    habits = await CommitmentService.list_commitments(db, USER_ID, type_="habit", status="active")
    daily_habits = []
    for h in habits:
        h.progress = await ProgressService.compute_progress(db, h)
        records = await RecordService.get_records(db, commitment_id=h.id, date_from=target_date, date_to=target_date)
        today_record = records[0] if records else None
        daily_habits.append(DailyHabitCheckin(commitment=h, today_record=today_record))
        
    # 2. Today's tasks
    tasks = await CommitmentService.list_commitments(db, USER_ID, type_="task")
    daily_tasks = [t for t in tasks if t.due_date == target_date]
    for t in daily_tasks:
        t.progress = await ProgressService.compute_progress(db, t)
        
    # 3. Free records (records without commitment_id)
    all_today_records = await RecordService.get_records(db, date_from=target_date, date_to=target_date)
    free_records = [r for r in all_today_records if r.commitment_id is None]
    
    response_data = DailyResponse(
        date=target_date,
        habits=daily_habits,
        tasks=daily_tasks,
        free_records=free_records
    )
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=response_data)
