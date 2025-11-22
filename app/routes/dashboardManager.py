from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.models.schemas import Product, Stock, Transaction, TxnType, TxnStatus
from app.models.create_db import get_session

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis")
def get_dashboard_kpis(session: Session = Depends(get_session)):
    
    total_products = session.exec(select(Product)).count()
    
    low_stock_items = session.exec(
        select(Stock).where(Stock.free_to_use <= 5)
    ).count()
    
    pending_receipts = session.exec(
        select(Transaction).where(
            Transaction.type == TxnType.receipt,
            Transaction.status.in_([TxnStatus.waiting, TxnStatus.ready])
        )
    ).count()
    
    pending_deliveries = session.exec(
        select(Transaction).where(
            Transaction.type == TxnType.delivery,
            Transaction.status.in_([TxnStatus.waiting, TxnStatus.ready])
        )
    ).count()
    
    internal_transfers = session.exec(
        select(Transaction).where(
            Transaction.type == TxnType.internal_adjustment,
            Transaction.status == TxnStatus.waiting
        )
    ).count()
    
    return {
        "total_products" : total_products,
        "low_stock_items" : low_stock_items,
        "pending_receipts" : pending_receipts,
        "pending_deliveries" : pending_deliveries,
        "internal_transfers" : internal_transfers  
    }
    
@router.get("/transactions")
def filter_transactions(
    txn_type: TxnType | None = None,
    status: TxnStatus | None = None,
    warehouse_id: int | None = None,
    category: str | None = None,
    session: Session = Depends(get_session)
):
    query = select(Transaction)

    if txn_type:
        query = query.where(Transaction.type == txn_type)

    if status:
        query = query.where(Transaction.status == status)

    if warehouse_id:
        query = query.where(
            (Transaction.from_warehouse == warehouse_id) |
            (Transaction.to_warehouse == warehouse_id)
        )

    if category:
        from app.models.schemas import TransactionLine, Product
        query = (
            select(Transaction)
            .join(TransactionLine)
            .join(Product)
            .where(Product.category == category)
        )

    return session.exec(query).all()