from fastapi import FastAPI
from fastapi import APIRouter, HTTPException, Depends
from app.models.create_db import get_session

from app.models.schemas import *
from sqlmodel import Session, select
from typing import List

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/")
def read_products(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    stock = session.exec(select(Stock)).all()
    return products, stock


class ProductStockResponse(SQLModel):
    product: Product
    stock: Stock


@router.post("/")
def create_product(
    product: Product,
    warehouse_id: int,
    session: Session = Depends(get_session),
    quantity: float = 0,
):
    session.add(product)
    session.commit()
    session.refresh(product)
    print("Product created:", product)

    stock = Stock(
        warehouse_id=warehouse_id,
        product_id=product.id,
        on_hand=quantity,
        free_to_use=quantity,
    )

    session.add(stock)
    session.commit()
    session.refresh(stock)
    session.refresh(product)
    return {
        "product": product,
        "stock": stock,
    }


# 2. Receipts (Incoming Goods)
# Used when items arrive from vendors.
# Process:
# 1. Create a new receipt.
# 2. Add supplier & products.
# 3. Input quantities received.
# 4. Validate → stock increases automatically.
# Example:
# ● Receive 50 units of “Steel Rodsˮ → stock +50.


@router.post("/create_receipt/")
def create_receipt(
    product_id: int,
    supplier: str,
    quantity: float,
    to_warehouse_id: int,
    scheduled_date: Optional[datetime] = None,
    user_id: int = None,
    session: Session = Depends(get_session),
):
    type_txn = TxnType.receipt
    try:
        last_id_of_receipt_txn = (
            session.exec(
                select(Transaction)
                .where(
                    Transaction.type == type_txn
                    and Transaction.to_warehouse == to_warehouse_id
                )
                .order_by(Transaction.id.desc())
            )
            .first()
            .id
        )
    except AttributeError:
        last_id_of_receipt_txn = 0
    reference_number = f"{to_warehouse_id}/IN/{last_id_of_receipt_txn + 1}"
    receipt_txn = Transaction(
        type=type_txn,
        status=TxnStatus.ready,
        supplier=supplier,
        to_warehouse=to_warehouse_id,
        reference_number=reference_number,
        scheduled_date=scheduled_date,
        contact="Supplier XYZ",
        created_by=user_id,
        product_id=product_id,
        quantity=quantity,
    )
    session.add(receipt_txn)
    session.commit()
    session.refresh(receipt_txn)
    print("Receipt Transaction created:", receipt_txn)
    return receipt_txn


# 3. Delivery Orders (Outgoing Goods)
# Used when stock leaves the warehouse for customer shipment.
# Process:
# 1. Pick items.
# 2. Pack items.
# 3. Validate → stock decreases automatically.
# Example:
# Sales order for 10 chairs → Delivery order reduces chairs by 10.


@router.post("/create_delivery_order/")
def create_delivery_order(
    product_id: int,
    quantity: float,
    from_warehouse_id: int,
    scheduled_date: Optional[datetime] = None,
    user_id: int = None,
    session: Session = Depends(get_session),
    delivery_address: Optional[str] = None,
):
    type_txn = TxnType.delivery
    try:
        last_id_of_delivery_txn = (
            session.exec(
                select(Transaction)
                .where(
                    Transaction.type == type_txn
                    and Transaction.from_warehouse == from_warehouse_id
                )
                .order_by(Transaction.id.desc())
            )
            .first()
            .id
        )
    except AttributeError:
        last_id_of_delivery_txn = 0
    reference_number = f"{from_warehouse_id}/OUT/{last_id_of_delivery_txn + 1}"
    delivery_txn = Transaction(
        type=type_txn,
        status=TxnStatus.ready,
        from_warehouse=from_warehouse_id,
        reference_number=reference_number,
        scheduled_date=scheduled_date,
        contact="Customer ABC",
        created_by=user_id,
        product_id=product_id,
        quantity=quantity,
        delivery_address=delivery_address,
    )
    session.add(delivery_txn)
    session.commit()
    session.refresh(delivery_txn)
    print("Delivery Order Transaction created:", delivery_txn)
    return delivery_txn


@router.post("validate_transaction/{transaction_id}")
def validate_transaction(
    transaction_id: int,
    session: Session = Depends(get_session),
):
    transaction = session.get(Transaction, transaction_id)
    # print(type(transaction.quantity))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status != TxnStatus.ready:
        raise HTTPException(
            status_code=400, detail="Only 'ready' transactions can be validated"
        )

    # dont use transaction lines for now, just assume one product per transaction
    # get product id from transaction id
    product_id = transaction.product_id
    quantity = transaction.quantity
    if transaction.type == TxnType.receipt:
        stock = session.exec(
            select(Stock).where(
                (Stock.product_id == product_id)
                & (Stock.warehouse_id == transaction.to_warehouse)
            )
        ).first()
        if stock:
            print("Existing stock found:", stock)
            stock.on_hand += float(quantity)
            stock.free_to_use += float(quantity)
            session.add(stock)
        else:
            stock = Stock(
                warehouse_id=transaction.to_warehouse,
                product_id=product_id,
                on_hand=quantity,
                free_to_use=quantity,
            )
            session.add(stock)
        transaction.status = TxnStatus.done
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        print("Receipt transaction validated and stock updated:", transaction)
        return transaction
    elif transaction.type == TxnType.delivery:
        stock = session.exec(
            select(Stock).where(
                (Stock.product_id == product_id)
                & (Stock.warehouse_id == transaction.from_warehouse)
            )
        ).first()
        if not stock or stock.free_to_use < quantity:
            raise HTTPException(
                status_code=400, detail="Insufficient stock for delivery"
            )
        stock.on_hand -= quantity
        stock.free_to_use -= quantity
        session.add(stock)
        transaction.status = TxnStatus.done
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        print("Delivery order transaction validated and stock updated:", transaction)
        return transaction


@router.get("/all-receipts/")
def get_all_receipts(warehouse_id: int, session: Session = Depends(get_session)):
    receipts = session.exec(
        select(Transaction).where(
            (Transaction.type == TxnType.receipt)
            & (Transaction.to_warehouse == warehouse_id)
        )
    ).all()
    return receipts


@router.get("/all-deliveries/")
def get_all_deliveries(warehouse_id: int, session: Session = Depends(get_session)):
    deliveries = session.exec(
        select(Transaction).where(
            (Transaction.type == TxnType.delivery)
            & (Transaction.from_warehouse == warehouse_id)
        )
    ).all()
    return deliveries


@router.post("/update_cost_stock/")
def update_cost_stock(
    product_id: int,
    warehouse_id: int | None = None,
    product_unit_cost: float | None = None,
    on_hand: float | None = None,
    free_to_use: float | None = None,
    session: Session = Depends(get_session),
):
    """Update a product's unit cost and/or stock quantities.

    - `product_unit_cost` (optional): if provided and `warehouse_id` omitted, updates cost for all
      stock records of the product. If `warehouse_id` provided, updates/creates the stock row for that warehouse.
    - `on_hand` / `free_to_use` (optional): quantity updates. These require `warehouse_id` to be provided.
      If the stock row for the given warehouse does not exist it will be created.

    Returns the updated/created Stock records.
    """
    updated = []

    # Update unit cost
    if product_unit_cost is not None:
        if warehouse_id is None:
            # update all stock rows for this product
            stocks = session.exec(
                select(Stock).where(Stock.product_id == product_id)
            ).all()
            for s in stocks:
                s.product_unit_cost = product_unit_cost
                session.add(s)
            session.commit()
            for s in stocks:
                session.refresh(s)
                updated.append(s)
        else:
            stock_item = session.exec(
                select(Stock).where(
                    (Stock.product_id == product_id)
                    & (Stock.warehouse_id == warehouse_id)
                )
            ).first()
            if stock_item:
                stock_item.product_unit_cost = product_unit_cost
                session.add(stock_item)
                session.commit()
                session.refresh(stock_item)
                updated.append(stock_item)
            else:
                # create new stock row with provided cost
                new_stock = Stock(
                    warehouse_id=warehouse_id,
                    product_id=product_id,
                    product_unit_cost=product_unit_cost,
                    on_hand=0,
                    free_to_use=0,
                )
                session.add(new_stock)
                session.commit()
                session.refresh(new_stock)
                updated.append(new_stock)

    # Update quantities (require warehouse)
    if on_hand is not None or free_to_use is not None:
        if warehouse_id is None:
            raise HTTPException(
                status_code=400, detail="warehouse_id is required to update quantities"
            )

        stock_item = session.exec(
            select(Stock).where(
                (Stock.product_id == product_id) & (Stock.warehouse_id == warehouse_id)
            )
        ).first()

        if not stock_item:
            # create new stock record with provided quantities
            stock_item = Stock(
                warehouse_id=warehouse_id,
                product_id=product_id,
                product_unit_cost=(
                    product_unit_cost if product_unit_cost is not None else 0
                ),
                on_hand=on_hand if on_hand is not None else 0,
                free_to_use=free_to_use if free_to_use is not None else 0,
            )
            session.add(stock_item)
            session.commit()
            session.refresh(stock_item)
            updated.append(stock_item)
        else:
            if on_hand is not None:
                stock_item.on_hand = on_hand
            if free_to_use is not None:
                stock_item.free_to_use = free_to_use
            # If product_unit_cost was provided earlier for same warehouse, it will already be set
            session.add(stock_item)
            session.commit()
            session.refresh(stock_item)
            updated.append(stock_item)

    return updated


# 4. Internal Transfers
# Move stock inside the company:
# Example:
# ● Main Warehouse → Production Floor
# ● Rack A → Rack B
# ● Warehouse 1 → Warehouse 2
# Each movement is logged in the ledger.


@router.post("/create_internal_transfer/")
def create_internal_transfer(
    product_id: int,
    quantity: float,
    from_warehouse_id: int,
    to_warehouse_id: int,
    scheduled_date: Optional[datetime] = None,
    user_id: int = None,
    session: Session = Depends(get_session),
):
    type_txn = TxnType.internal_adjustment
    try:
        last_id_of_internal_txn = (
            session.exec(
                select(Transaction)
                .where(
                    Transaction.type == type_txn
                    and Transaction.from_warehouse == from_warehouse_id
                    and Transaction.to_warehouse == to_warehouse_id
                )
                .order_by(Transaction.id.desc())
            )
            .first()
            .id
        )
    except AttributeError:
        last_id_of_internal_txn = 0
    reference_number = f"{from_warehouse_id}/INT/{last_id_of_internal_txn + 1}"
    internal_txn = Transaction(
        type=type_txn,
        status=TxnStatus.ready,
        from_warehouse=from_warehouse_id,
        to_warehouse=to_warehouse_id,
        reference_number=reference_number,
        scheduled_date=scheduled_date,
        contact="Internal Transfer",
        created_by=user_id,
    )
    session.add(internal_txn)
    session.commit()
    session.refresh(internal_txn)
    print("Internal Transfer Transaction created:", internal_txn)
    # add in StockLedger
    ledger_entry = StockLedger(
        product_id=product_id,
        warehouse_id=from_warehouse_id,
        quantity_change=-quantity,
        created_at=datetime.utcnow(),
        transaction_id=internal_txn.id,
    )
    ledger_entry2 = StockLedger(
        product_id=product_id,
        warehouse_id=to_warehouse_id,
        quantity_change=quantity,
        created_at=datetime.utcnow(),
        transaction_id=internal_txn.id,
    )
    session.add(ledger_entry)
    session.add(ledger_entry2)
    session.commit()
    session.refresh(ledger_entry)
    print("Stock Ledger entry created for internal transfer:", ledger_entry)
    # update stock levels for both warehouses
    # Deduct from source warehouse
    source_stock = session.exec(
        select(Stock).where(
            (Stock.product_id == product_id) & (Stock.warehouse_id == from_warehouse_id)
        )
    ).first()
    if not source_stock or source_stock.free_to_use < quantity:
        raise HTTPException(
            status_code=400, detail="Insufficient stock for internal transfer"
        )
    source_stock.on_hand -= quantity
    source_stock.free_to_use -= quantity
    session.add(source_stock)
    # Add to destination warehouse
    dest_stock = session.exec(
        select(Stock).where(
            (Stock.product_id == product_id) & (Stock.warehouse_id == to_warehouse_id)
        )
    ).first()
    if dest_stock:
        dest_stock.on_hand += quantity
        dest_stock.free_to_use += quantity
        session.add(dest_stock)
    else:
        dest_stock = Stock(
            warehouse_id=to_warehouse_id,
            product_id=product_id,
            on_hand=quantity,
            free_to_use=quantity,
        )
        session.add(dest_stock)

    session.add(ledger_entry)
    session.commit()
    session.refresh(ledger_entry)
    print("Stock Ledger entry created for internal transfer:", ledger_entry)
    return internal_txn


# 5. Stock Adjustments
# Fix mismatches between:
# ● Recorded stock
# ● Physical count
# Steps:
# 1. Select product/location
# 2. Enter counted quantity
# 3. System auto-updates and logs the adjustment


@router.post("/adjust_stock/")
def adjust_stock(
    product: Product,
    warehouse_id: int,
    counted_qty: float,
    session: Session = Depends(get_session),
):
    stock = session.exec(
        select(Stock).where(
            (Stock.product_id == product.id) & (Stock.warehouse_id == warehouse_id)
        )
    ).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock record not found")

    system_qty = stock.on_hand
    adjustment_qty = counted_qty - system_qty

    stock.on_hand = counted_qty
    stock.free_to_use += adjustment_qty
    session.add(stock)
    session.commit()
    session.refresh(stock)

    # Log adjustment in StockLedger
    ledger_entry = StockLedger(
        product_id=product.id,
        warehouse_id=warehouse_id,
        quantity=adjustment_qty,
        entry_date=datetime.utcnow(),
        adjustment=True,
    )
    session.add(ledger_entry)
    session.commit()
    session.refresh(ledger_entry)
    print("Stock adjusted and ledger entry created:", ledger_entry)

    return {
        "product": product,
        "warehouse_id": warehouse_id,
        "counted_qty": counted_qty,
        "system_qty": system_qty,
        "adjustment_qty": adjustment_qty,
    }


@router.get("/stock_ledger/")
def get_stock_ledger(
    warehouse_id: int,
    session: Session = Depends(get_session),
):
    ledger_entries = session.exec(
        select(StockLedger).where(
            (StockLedger.from_warehouse_id == warehouse_id)
            | (StockLedger.to_warehouse_id == warehouse_id)
        )
    ).all()
    return ledger_entries


# get all stock and products in a warehouse
