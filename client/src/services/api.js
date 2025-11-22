// ----------------------------
// MOCK DATA FOR FRONTEND
// ----------------------------

// USERS
export const users = [
  {
    id: 1,
    full_name: 'Aarya Raj',
    email: 'aarya@example.com',
    role: 'inventory_manager',
  },
  {
    id: 2,
    full_name: 'Krish Patel',
    email: 'krish@example.com',
    role: 'warehouse_staff',
  },
]

// WAREHOUSES
export const warehouses = [
  { id: 1, name: 'Main Warehouse', short_code: 'WH1', address: 'Mumbai' },
  { id: 2, name: 'Secondary Warehouse', short_code: 'WH2', address: 'Pune' },
]

// PRODUCTS
export const products = [
  {
    id: 1,
    name: 'Steel Rod',
    sku: 'STL-001',
    category: 'Raw Material',
    uom: 'kg',
  },
  {
    id: 2,
    name: 'Wooden Chair',
    sku: 'WCH-002',
    category: 'Furniture',
    uom: 'pcs',
  },
  {
    id: 3,
    name: 'Aluminium Sheet',
    sku: 'ALM-101',
    category: 'Raw Material',
    uom: 'kg',
  },
]

// STOCK PER WAREHOUSE
export const stock = [
  {
    id: 1,
    warehouse_id: 1,
    product_id: 1,
    on_hand: 120,
    free_to_use: 110,
    product_unit_cost: 45,
  },
  {
    id: 2,
    warehouse_id: 1,
    product_id: 2,
    on_hand: 35,
    free_to_use: 35,
    product_unit_cost: 600,
  },
  {
    id: 3,
    warehouse_id: 2,
    product_id: 1,
    on_hand: 50,
    free_to_use: 50,
    product_unit_cost: 45,
  },
  {
    id: 4,
    warehouse_id: 2,
    product_id: 3,
    on_hand: 80,
    free_to_use: 80,
    product_unit_cost: 90,
  },
]

// TRANSACTIONS (Receipts, Deliveries, Adjustments, Internal Transfers)
export const transactions = [
  {
    id: 1,
    type: 'receipt',
    status: 'done',
    reference_number: 'REC-001',
    scheduled_date: '2024-11-10',
    completion_date: '2024-11-11',
    from_warehouse: null,
    to_warehouse: 1,
    contact: 'ABC Metals Supplier',
    created_at: '2024-11-10T10:45:00Z',
    created_by: 1,
  },
  {
    id: 2,
    type: 'delivery',
    status: 'ready',
    reference_number: 'DEL-180',
    scheduled_date: '2024-11-20',
    completion_date: null,
    from_warehouse: 1,
    to_warehouse: null,
    contact: 'Trinity Furniture',
    created_at: '2024-11-18T12:30:00Z',
    created_by: 2,
  },
  {
    id: 3,
    type: 'internal_transfer',
    status: 'done',
    reference_number: 'INT-045',
    from_warehouse: 1,
    to_warehouse: 2,
    scheduled_date: '2024-11-17',
    completion_date: '2024-11-17',
    created_at: '2024-11-17T08:00:00Z',
    created_by: 1,
  },
  {
    id: 4,
    type: 'internal_adjustment',
    status: 'done',
    reference_number: 'ADJ-020',
    from_warehouse: 1,
    to_warehouse: null,
    contact: 'Damage correction',
    created_at: '2024-11-15T15:12:00Z',
    created_by: 2,
  },
]

// TRANSACTION LINES
export const transactionLines = [
  { id: 1, transaction_id: 1, product_id: 1, quantity: 50, unit_cost: 45 },
  { id: 2, transaction_id: 2, product_id: 2, quantity: 10, unit_cost: 600 },
  { id: 3, transaction_id: 3, product_id: 1, quantity: 30 },
  {
    id: 4,
    transaction_id: 4,
    product_id: 1,
    quantity: -3,
    system_qty: 120,
    counted_qty: 117,
  },
]

// STOCK LEDGER (audit log)
export const stockLedger = [
  {
    id: 1,
    transaction_id: 1,
    product_id: 1,
    warehouse_id: 1,
    quantity_change: +50,
    created_at: '2024-11-10T11:00:00Z',
  },
  {
    id: 2,
    transaction_id: 2,
    product_id: 2,
    warehouse_id: 1,
    quantity_change: -10,
    created_at: '2024-11-20T14:00:00Z',
  },
  {
    id: 3,
    transaction_id: 3,
    product_id: 1,
    warehouse_id: 2,
    quantity_change: +30,
    created_at: '2024-11-17T09:00:00Z',
  },
  {
    id: 4,
    transaction_id: 4,
    product_id: 1,
    warehouse_id: 1,
    quantity_change: -3,
    created_at: '2024-11-15T15:20:00Z',
  },
]

// ----------------------------
// MOCK API FUNCTIONS (FAKE BACKEND)
// ----------------------------

// PRODUCTS
export const getProducts = () => Promise.resolve(products)
export const getProduct = (id) =>
  Promise.resolve(products.find((p) => p.id === id))

// WAREHOUSES
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const getWarehouses = async () => {
  const res = await fetch(`${API_URL}/warehouses/`)
  if (!res.ok) throw new Error('Failed to fetch warehouses')
  return await res.json()
}
export const getWarehouse = (id) =>
  Promise.resolve(warehouses.find((w) => w.id === id))

// STOCK
export const getStock = () => Promise.resolve(stock)
export const getStockByWarehouse = (warehouseId) =>
  Promise.resolve(stock.filter((s) => s.warehouse_id === warehouseId))
export const getStockByProduct = (productId) =>
  Promise.resolve(stock.filter((s) => s.product_id === productId))

// TRANSACTIONS
export const getAllTransactions = () => Promise.resolve(transactions)
export const getTransactionsByType = (type) =>
  Promise.resolve(transactions.filter((t) => t.type === type))
export const getTransaction = (id) =>
  Promise.resolve(transactions.find((t) => t.id === parseInt(id)))
export const getTransactionsByWarehouse = (warehouseId) =>
  Promise.resolve(
    transactions.filter(
      (t) =>
        t.from_warehouse === parseInt(warehouseId) ||
        t.to_warehouse === parseInt(warehouseId)
    )
  )

// TRANSACTION LINES
export const getTransactionLines = (txnId) =>
  Promise.resolve(
    transactionLines.filter((tl) => tl.transaction_id === parseInt(txnId))
  )
export const getTransactionLine = (id) =>
  Promise.resolve(transactionLines.find((tl) => tl.id === parseInt(id)))

// LEDGER
export const getStockLedger = () => Promise.resolve(stockLedger)
export const getStockLedgerByProduct = (productId) =>
  Promise.resolve(
    stockLedger.filter((entry) => entry.product_id === parseInt(productId))
  )
export const getStockLedgerByWarehouse = (warehouseId) =>
  Promise.resolve(
    stockLedger.filter((entry) => entry.warehouse_id === parseInt(warehouseId))
  )

// USERS
export const getUsers = () => Promise.resolve(users)
export const getUser = (id) =>
  Promise.resolve(users.find((u) => u.id === parseInt(id)))

// CREATE/UPDATE OPERATIONS (with simulated delay)
export const createTransaction = (transactionData) => {
  const newTransaction = {
    id: transactions.length + 1,
    ...transactionData,
    created_at: new Date().toISOString(),
    created_by: 1, // Default user
  }
  transactions.push(newTransaction)
  return Promise.resolve(newTransaction)
}

export const createTransactionLine = (lineData) => {
  const newLine = {
    id: transactionLines.length + 1,
    ...lineData,
  }
  transactionLines.push(newLine)
  return Promise.resolve(newLine)
}

export const updateTransaction = (id, updates) => {
  const index = transactions.findIndex((t) => t.id === parseInt(id))
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates }
    return Promise.resolve(transactions[index])
  }
  return Promise.reject(new Error('Transaction not found'))
}

export const updateStock = (warehouseId, productId, updates) => {
  const index = stock.findIndex(
    (s) =>
      s.warehouse_id === parseInt(warehouseId) &&
      s.product_id === parseInt(productId)
  )
  if (index !== -1) {
    stock[index] = { ...stock[index], ...updates }
    return Promise.resolve(stock[index])
  }
  return Promise.reject(new Error('Stock item not found'))
}

// SEARCH FUNCTIONS
export const searchProducts = (query) => {
  const lowerQuery = query.toLowerCase()
  return Promise.resolve(
    products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery)
    )
  )
}

export const searchTransactions = (query) => {
  const lowerQuery = query.toLowerCase()
  return Promise.resolve(
    transactions.filter(
      (t) =>
        t.reference_number.toLowerCase().includes(lowerQuery) ||
        (t.contact && t.contact.toLowerCase().includes(lowerQuery))
    )
  )
}

// UTILITY FUNCTIONS
export const getLowStockItems = (threshold = 20) => {
  return Promise.resolve(stock.filter((item) => item.on_hand < threshold))
}

export const getTransactionStats = () => {
  const stats = {
    total: transactions.length,
    byType: {},
    byStatus: {},
  }

  transactions.forEach((txn) => {
    stats.byType[txn.type] = (stats.byType[txn.type] || 0) + 1
    stats.byStatus[txn.status] = (stats.byStatus[txn.status] || 0) + 1
  })

  return Promise.resolve(stats)
}

// Simulate API delay
const withDelay = (data, delay = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay))

// Export all functions with delay
export default {
  // Products
  getProducts: () => withDelay(getProducts()),
  getProduct: (id) => withDelay(getProduct(id)),

  // Warehouses
  getWarehouses: () => withDelay(getWarehouses()),
  getWarehouse: (id) => withDelay(getWarehouse(id)),

  // Stock
  getStock: () => withDelay(getStock()),
  getStockByWarehouse: (warehouseId) =>
    withDelay(getStockByWarehouse(warehouseId)),
  getStockByProduct: (productId) => withDelay(getStockByProduct(productId)),
  updateStock: (warehouseId, productId, updates) =>
    withDelay(updateStock(warehouseId, productId, updates)),

  // Transactions
  getAllTransactions: () => withDelay(getAllTransactions()),
  getTransactionsByType: (type) => withDelay(getTransactionsByType(type)),
  getTransaction: (id) => withDelay(getTransaction(id)),
  getTransactionsByWarehouse: (warehouseId) =>
    withDelay(getTransactionsByWarehouse(warehouseId)),
  createTransaction: (data) => withDelay(createTransaction(data)),
  updateTransaction: (id, updates) => withDelay(updateTransaction(id, updates)),

  // Transaction Lines
  getTransactionLines: (txnId) => withDelay(getTransactionLines(txnId)),
  getTransactionLine: (id) => withDelay(getTransactionLine(id)),
  createTransactionLine: (data) => withDelay(createTransactionLine(data)),

  // Ledger
  getStockLedger: () => withDelay(getStockLedger()),
  getStockLedgerByProduct: (productId) =>
    withDelay(getStockLedgerByProduct(productId)),
  getStockLedgerByWarehouse: (warehouseId) =>
    withDelay(getStockLedgerByWarehouse(warehouseId)),

  // Users
  getUsers: () => withDelay(getUsers()),
  getUser: (id) => withDelay(getUser(id)),

  // Search
  searchProducts: (query) => withDelay(searchProducts(query)),
  searchTransactions: (query) => withDelay(searchTransactions(query)),

  // Utilities
  getLowStockItems: (threshold) => withDelay(getLowStockItems(threshold)),
  getTransactionStats: () => withDelay(getTransactionStats()),
}
