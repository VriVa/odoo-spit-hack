// Adapter to call backend endpoints with fallback to in-memory mocks.
// This file prefers the real FastAPI backend at `VITE_API_URL` or `http://localhost:8000`.
// If a backend call fails, the module falls back to the existing mock data so the UI remains usable.

// --- Mock data (kept for fallback) ---
export const users = [
  { id: 1, full_name: "Aarya Raj", email: "aarya@example.com", role: "inventory_manager" },
  { id: 2, full_name: "Krish Patel", email: "krish@example.com", role: "warehouse_staff" }
];

export const warehouses = [
  { id: 1, name: "Main Warehouse", short_code: "WH1", address: "Mumbai" },
  { id: 2, name: "Secondary Warehouse", short_code: "WH2", address: "Pune" }
];

export const products = [
  { id: 1, name: "Steel Rod", sku: "STL-001", category: "Raw Material", uom: "kg" },
  { id: 2, name: "Wooden Chair", sku: "WCH-002", category: "Furniture", uom: "pcs" },
  { id: 3, name: "Aluminium Sheet", sku: "ALM-101", category: "Raw Material", uom: "kg" }
];

export const stock = [
  { id: 1, warehouse_id: 1, product_id: 1, on_hand: 120, free_to_use: 110, product_unit_cost: 45 },
  { id: 2, warehouse_id: 1, product_id: 2, on_hand: 35, free_to_use: 35, product_unit_cost: 600 },
  { id: 3, warehouse_id: 2, product_id: 1, on_hand: 50, free_to_use: 50, product_unit_cost: 45 },
  { id: 4, warehouse_id: 2, product_id: 3, on_hand: 80, free_to_use: 80, product_unit_cost: 90 }
];

export const transactions = [];
export const transactionLines = [];
export const stockLedger = [];

// --- Backend configuration ---
const baseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000';

async function safeFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Bubble up the error so callers can decide to fallback.
    throw err;
  }
}

// --- API functions that call backend, with fallback to mock data ---
export const getSidebar = async () => {
  try {
    return await safeFetch('/nav/sidebar');
  } catch (e) {
    // fallback to mock navigation from backend attachment
    return await Promise.resolve([
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Products', icon: 'inventory', children: [
        { label: 'All Products', path: '/products' },
        { label: 'Stock Availability', path: '/products/stock' },
        { label: 'Categories', path: '/products/categories' },
        { label: 'Reordering Rules', path: '/products/reorder-rules' }
      ]},
      { label: 'Operations', icon: 'swap_horiz', children: [
        { label: 'Receipts', path: '/operations/receipts' },
        { label: 'Delivery Orders', path: '/operations/deliveries' },
        { label: 'Internal Transfers', path: '/operations/internal' },
        { label: 'Stock Adjustments', path: '/operations/adjustments' }
      ]},
      { label: 'Move History', icon: 'history', path: '/moves' },
      { label: 'Settings', icon: 'settings', path: '/settings' },
      { label: 'Profile', icon: 'person', children: [
        { label: 'My Profile', path: '/profile' }, { label: 'Logout', path: '/logout' }
      ]}
    ]);
  }
};

export const getDashboardKpis = async () => {
  try {
    return await safeFetch('/dashboard/kpis');
  } catch (e) {
    // fallback: compute simple KPIs from mocks
    return {
      total_products: products.length,
      low_stock_items: stock.filter(s => s.free_to_use <= 5).length,
      pending_receipts: 0,
      pending_deliveries: 0,
      internal_transfers: 0
    };
  }
};

export const getProducts = async () => {
  try {
    // backend `GET /products/` returns [products, stock]
    const data = await safeFetch('/products/');
    // if backend returns tuple [products, stock]
    if (Array.isArray(data) && data.length >= 1) {
      return { products: data[0], stock: data[1] || [] };
    }
    return { products: data, stock: [] };
  } catch (e) {
    return { products, stock };
  }
};

export const getProduct = async (id) => {
  try {
    // no dedicated single-product route in productManager; fall back to fetching all
    const { products: ps } = await getProducts();
    return ps.find(p => p.id === Number(id));
  } catch (e) {
    return products.find(p => p.id === Number(id));
  }
};

export const getWarehouses = async () => {
  // backend does not expose warehouses in the routes we inspected; return mock for now
  return Promise.resolve(warehouses);
};

export const getStock = async () => {
  try {
    const { stock: s } = await getProducts();
    return s;
  } catch (e) {
    return stock;
  }
};

export const getStockByWarehouse = async (warehouseId) => {
  const all = await getStock();
  return all.filter(s => Number(s.warehouse_id) === Number(warehouseId));
};

export const getTransactions = async (filters = {}) => {
  // productManager and dashboardManager expose transaction creation and filtering.
  // Use `/dashboard/transactions` with query params when available.
  const params = new URLSearchParams();
  if (filters.txn_type) params.append('txn_type', filters.txn_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.warehouse_id) params.append('warehouse_id', String(filters.warehouse_id));
  if (filters.category) params.append('category', filters.category);
  const path = `/dashboard/transactions${params.toString() ? '?' + params.toString() : ''}`;
  try {
    return await safeFetch(path);
  } catch (e) {
    // fallback to empty list (or return mock transactions array if you want)
    return transactions;
  }
};

// Transaction creation helpers (call productManager endpoints)
export const createReceipt = async ({ product_id, supplier, quantity, to_warehouse_id, scheduled_date, user_id }) => {
  try {
    const params = new URLSearchParams({ product_id, supplier, quantity, to_warehouse_id });
    // POST form-style by query string as backend expects query params in definitions
    return await safeFetch(`/products/create_receipt/?${params.toString()}`, { method: 'POST' });
  } catch (e) {
    // fallback: create a simple tx in mock
    const tx = { id: Date.now(), type: 'receipt', status: 'ready', product_id, quantity, to_warehouse: to_warehouse_id };
    transactions.push(tx);
    return tx;
  }
};

export const createDeliveryOrder = async ({ product_id, quantity, from_warehouse_id }) => {
  try {
    const params = new URLSearchParams({ product_id, quantity, from_warehouse_id });
    return await safeFetch(`/products/create_delivery_order/?${params.toString()}`, { method: 'POST' });
  } catch (e) {
    const tx = { id: Date.now(), type: 'delivery', status: 'ready', product_id, quantity, from_warehouse: from_warehouse_id };
    transactions.push(tx);
    return tx;
  }
};

export const validateTransaction = async (transaction_id) => {
  try {
    return await safeFetch(`/products/validate_transaction/${transaction_id}`, { method: 'POST' });
  } catch (e) {
    throw e;
  }
};

export const getStockLedger = async () => {
  // backend endpoints not inspected for ledger; return mock
  return Promise.resolve(stockLedger);
};

export const getUsers = async () => {
  // no users route in routes we inspected — return mock
  return Promise.resolve(users);
};

// Simple search helpers using mock or backend where available
export const searchProducts = async (query) => {
  try {
    // backend search endpoint not defined, fallback to client-side
    const { products: ps } = await getProducts();
    return ps.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())));
  } catch (e) {
    return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())));
  }
};

export default {
  // Navigation
  getSidebar,
  // Dashboard
  getDashboardKpis,
  // Products & stock
  getProducts,
  getProduct,
  getWarehouses,
  getStock,
  getStockByWarehouse,
  // Transactions
  getTransactions,
  createReceipt,
  createDeliveryOrder,
  validateTransaction,
  // Ledger / users
  getStockLedger,
  getUsers,
  // Search
  searchProducts,
};