import enum
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Enum
from typing import Optional
from datetime import datetime


class UserRole(str, enum.Enum):
    inventory_manager = "inventory_manager"
    warehouse_staff = "warehouse_staff"


class TxnType(str, enum.Enum):
    receipt = "receipt"
    delivery = "delivery"
    internal_adjustment = "internal_adjustment"


class TxnStatus(str, enum.Enum):
    draft = "draft"
    waiting = "waiting"
    ready = "ready"
    done = "done"
    canceled = "canceled"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str
    password_hash: str
    role: UserRole = Field(
        sa_column=Column(Enum(UserRole)), default=UserRole.warehouse_staff
    )
    clerk_id: Optional[int] = None
    warehouse_id: Optional[int] = Field(foreign_key="warehouse.id")


class Warehouse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    short_code: str
    address: Optional[str] = None


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    sku: str
    category: Optional[str] = None
    uom: str


class Stock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    warehouse_id: int = Field(foreign_key="warehouse.id")
    product_id: int = Field(foreign_key="product.id")

    product_unit_cost: Optional[float] = 0
    on_hand: float = 0
    free_to_use: float = 0


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    type: TxnType = Field(sa_column=Column(Enum(TxnType)))
    status: TxnStatus = Field(
        default=TxnStatus.draft, sa_column=Column(Enum(TxnStatus))
    )

    scheduled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    product_id: Optional[int] = Field(foreign_key="product.id")
    quantity: Optional[float] = None
    from_warehouse: Optional[int] = Field(foreign_key="warehouse.id")
    to_warehouse: Optional[int] = Field(foreign_key="warehouse.id")
    supplier: Optional[str] = None
    delivery_address: Optional[str] = None
    contact: Optional[str] = None
    created_by: Optional[int] = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TransactionLine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    transaction_id: int = Field(foreign_key="transaction.id")
    product_id: int = Field(foreign_key="product.id")

    quantity: float
    unit_cost: Optional[float] = None

    counted_qty: Optional[float] = None
    system_qty: Optional[float] = None


class StockLedger(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    transaction_id: Optional[int] = Field(foreign_key="transaction.id")
    product_id: int = Field(foreign_key="product.id")
    warehouse_id: int = Field(foreign_key="warehouse.id")

    quantity_change: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
