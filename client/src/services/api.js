//mock api

// ----------------------------
// MOCK DATA FOR FRONTEND
// ----------------------------

// USERS
export const users = [
  {
    id: 1,
    full_name: "Aarya Raj",
    email: "aarya@example.com",
    role: "inventory_manager",
  },
  {
    id: 2,
    full_name: "Krish Patel",
    email: "krish@example.com",
    role: "warehouse_staff",
  }
];

// WAREHOUSES
export const warehouses = [
  { id: 1, name: "Main Warehouse", short_code: "WH1", address: "Mumbai" },
  { id: 2, name: "Secondary Warehouse", short_code: "WH2", address: "Pune" }
];

// PRODUCTS
export const products = [
  { id: 1, name: "Steel Rod", sku: "STL-001", category: "Raw Material", uom: "kg" },
  { id: 2, name: "Wooden Chair", sku: "WCH-002", category: "Furniture", uom: "pcs" },
  { id: 3, name: "Aluminium Sheet", sku: "ALM-101", category: "Raw Material", uom: "kg" }
];

// STOCK PER WAREHOUSE
export const stock = [
  { id: 1, warehouse_id: 1, product_id: 1, on_hand: 120, free_to_use: 110, product_unit_cost: 45 },
  { id: 2, warehouse_id: 1, product_id: 2, on_hand: 35, free_to_use: 35, product_unit_cost: 600 },
  { id: 3, warehouse_id: 2, product_id: 1, on_hand: 50, free_to_use: 50, product_unit_cost: 45 },
  { id: 4, warehouse_id: 2, product_id: 3, on_hand: 80, free_to_use: 80, product_unit_cost: 90 }
];

// TRANSACTIONS (Receipts, Deliveries, Adjustments, Internal Transfers)
export const transactions = [
  {
    id: 1,
    type: "receipt",
    status: "done",
    reference_number: "REC-001",
    scheduled_date: "2024-11-10",
    completion_date: "2024-11-11",
    from_warehouse: null,
    to_warehouse: 1,
    contact: "ABC Metals Supplier",
    created_at: "2024-11-10T10:45:00Z"
  },
  {
    id: 2,
    type: "delivery",
    status: "ready",
    reference_number: "DEL-180",
    scheduled_date: "2024-11-20",
    completion_date: null,
    from_warehouse: 1,
    to_warehouse: null,
    contact: "Trinity Furniture",
    created_at: "2024-11-18T12:30:00Z"
  },
  {
    id: 3,
    type: "internal_transfer",
    status: "done",
    reference_number: "INT-045",
    from_warehouse: 1,
    to_warehouse: 2,
    scheduled_date: "2024-11-17",
    completion_date: "2024-11-17",
    created_at: "2024-11-17T08:00:00Z"
  },
  {
    id: 4,
    type: "internal_adjustment",
    status: "done",
    reference_number: "ADJ-020",
    from_warehouse: 1,
    to_warehouse: null,
    contact: "Damage correction",
    created_at: "2024-11-15T15:12:00Z"
  }
];

// TRANSACTION LINES
export const transactionLines = [
  { id: 1, transaction_id: 1, product_id: 1, quantity: 50, unit_cost: 45 },
  { id: 2, transaction_id: 2, product_id: 2, quantity: 10, unit_cost: 600 },
  { id: 3, transaction_id: 3, product_id: 1, quantity: 30 },
  { id: 4, transaction_id: 4, product_id: 1, quantity: -3, system_qty: 120, counted_qty: 117 }
];

// STOCK LEDGER (audit log)
export const stockLedger = [
  {
    id: 1,
    transaction_id: 1,
    product_id: 1,
    warehouse_id: 1,
    quantity_change: +50,
    created_at: "2024-11-10T11:00:00Z"
  },
  {
    id: 2,
    transaction_id: 2,
    product_id: 2,
    warehouse_id: 1,
    quantity_change: -10,
    created_at: "2024-11-20T14:00:00Z"
  },
  {
    id: 3,
    transaction_id: 3,
    product_id: 1,
    warehouse_id: 2,
    quantity_change: +30,
    created_at: "2024-11-17T09:00:00Z"
  },
  {
    id: 4,
    transaction_id: 4,
    product_id: 1,
    warehouse_id: 1,
    quantity_change: -3,
    created_at: "2024-11-15T15:20:00Z"
  }
];

// ----------------------------
// MOCK API FUNCTIONS (FAKE BACKEND)
// ----------------------------

// PRODUCTS
export const getProducts = () => Promise.resolve(products);
export const getProduct = (id) => Promise.resolve(products.find(p => p.id === id));

// WAREHOUSES
export const getWarehouses = () => Promise.resolve(warehouses);

// STOCK
export const getStock = () => Promise.resolve(stock);
export const getStockByWarehouse = (warehouseId) =>
  Promise.resolve(stock.filter(s => s.warehouse_id === warehouseId));

// TRANSACTIONS
export const getAllTransactions = () => Promise.resolve(transactions);
export const getTransactionsByType = (type) =>
  Promise.resolve(transactions.filter(t => t.type === type));

export const getTransaction = (id) =>
  Promise.resolve(transactions.find(t => t.id === id));

// TRANSACTION LINES
export const getTransactionLines = (txnId) =>
  Promise.resolve(transactionLines.filter(tl => tl.transaction_id === txnId));

// LEDGER
export const getStockLedger = () => Promise.resolve(stockLedger);
