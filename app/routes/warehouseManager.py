from fastapi import FastAPI
from app.models.schemas import *

from fastapi import APIRouter, HTTPException, Depends
from app.models.create_db import get_session

from sqlmodel import Session, select
from typing import List

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("/")
def read_warehouses(session: Session = Depends(get_session)):
    warehouses = session.exec(select(Warehouse)).all()
    return List(warehouses)


@router.post("/")
def create_warehouse(
    warehouse: Warehouse,
    session: Session = Depends(get_session),
):
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    return warehouse
