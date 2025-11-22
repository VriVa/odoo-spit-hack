import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  LayoutGrid,
  List,
  Search,
  Package,
  ArrowRightLeft,
} from 'lucide-react'

// --- Configuration & Theme ---

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  waiting: {
    label: 'Waiting',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  done: {
    label: 'Done',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  canceled: {
    label: 'Canceled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
}

const STATUSES = Object.keys(STATUS_CONFIG)

const theme = {
  bg: '#FBF8F4',
  text: '#3E2723',
  textLight: '#5D4037',
  border: '#D7CCC8',
  inColor: '#4CAF50',
  outColor: '#D32F2F',
  transferColor: '#1976D2',
}

// --- Helper Components ---

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div
          className="h-4 rounded"
          style={{ backgroundColor: theme.border }}
        />
      </td>
    ))}
  </tr>
)

const SkeletonCard = () => (
  <div
    className="p-3 rounded-lg border animate-pulse mb-3"
    style={{ borderColor: theme.border, backgroundColor: 'white' }}
  >
    <div
      className="h-4 rounded mb-2"
      style={{ backgroundColor: theme.border, width: '60%' }}
    />
    <div
      className="h-3 rounded mb-2"
      style={{ backgroundColor: theme.border, width: '80%' }}
    />
    <div
      className="h-3 rounded"
      style={{ backgroundColor: theme.border, width: '40%' }}
    />
  </div>
)

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'draft'
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}

const DirectionIndicator = ({ fromId, toId }) => {
  // Logic for Internal Adjustment (Transfer)
  // If both From and To exist, it's a transfer
  if (fromId && toId) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: theme.transferColor }}
      >
        <ArrowRightLeft size={14} />
        TRANSFER
      </span>
    )
  }

  // Fallback logic for simple IN/OUT if data is partial
  const isIn = Boolean(toId && !fromId)
  const color = isIn ? theme.inColor : theme.outColor
  const Icon = isIn ? ArrowDownLeft : ArrowUpRight
  const label = isIn ? 'IN' : 'OUT'

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color }}
    >
      <Icon size={14} />
      {label}
    </span>
  )
}

// --- Main Component ---

const App = () => {
  const [transactions, setTransactions] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 1. Fetch Internal Adjustments (Transfers)
        const txResponse = await fetch(
          `${API_BASE_URL}/dashboard/transactions?txn_type=internal_adjustment`
        )
        // Handle potential errors if backend is not reachable in preview
        if (!txResponse.ok) throw new Error('Backend not reachable')
        const txData = await txResponse.json()

        // 2. Fetch Warehouses
        const whResponse = await fetch(`${API_BASE_URL}/warehouses/`)
        const whData = await whResponse.json()

        // 3. Fetch Products (returns [products, stock])
        const prodResponse = await fetch(`${API_BASE_URL}/products/`)
        const prodResponseData = await prodResponse.json()
        const prodData = Array.isArray(prodResponseData)
          ? prodResponseData[0]
          : prodResponseData

        setTransactions(txData)
        setWarehouses(whData)
        setProducts(prodData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        // For preview purposes only - if fetch fails, we stop loading to show empty state or error
        // In a real scenario, you might want to show an error message
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, wh) => {
      acc[wh.id] = wh.name
      return acc
    }, {})
  }, [warehouses])

  const productMap = useMemo(() => {
    return products.reduce((acc, prod) => {
      acc[prod.id] = { name: prod.name, sku: prod.sku }
      return acc
    }, {})
  }, [products])

  const movementRows = useMemo(() => {
    // Map transactions directly to rows (assuming 1 transaction = 1 product movement based on backend)
    return transactions.map((tx) => {
      const product = productMap[tx.product_id] || {
        name: 'Unknown',
        sku: 'N/A',
      }

      return {
        id: tx.id,
        reference: tx.reference_number,
        date: tx.scheduled_date
          ? new Date(tx.scheduled_date).toLocaleDateString()
          : tx.created_at
          ? new Date(tx.created_at).toLocaleDateString()
          : 'N/A',
        contact: tx.contact || 'Internal',
        fromWarehouseId: tx.from_warehouse,
        toWarehouseId: tx.to_warehouse,
        fromWarehouseName: tx.from_warehouse
          ? warehouseMap[tx.from_warehouse]
          : '-',
        toWarehouseName: tx.to_warehouse ? warehouseMap[tx.to_warehouse] : '-',
        productName: product.name,
        productSku: product.sku,
        quantity: tx.quantity || 0,
        status: tx.status,
      }
    })
  }, [transactions, warehouseMap, productMap])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return movementRows
    const query = searchQuery.toLowerCase()
    return movementRows.filter(
      (row) =>
        row.reference?.toLowerCase().includes(query) ||
        row.contact?.toLowerCase().includes(query) ||
        row.productName?.toLowerCase().includes(query)
    )
  }, [movementRows, searchQuery])

  const kanbanData = useMemo(() => {
    const grouped = {}
    STATUSES.forEach((status) => {
      grouped[status] = []
    })

    filteredRows.forEach((row) => {
      // Ensure status exists in config, else default to draft
      const statusKey = row.status ? row.status.toLowerCase() : 'draft'
      if (grouped[statusKey]) {
        grouped[statusKey].push(row)
      } else if (grouped['draft']) {
        grouped['draft'].push(row)
      }
    })

    return grouped
  }, [filteredRows])

  const renderListView = () => (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: theme.border }}
    >
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: theme.border }}>
          <tr>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              Reference
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              Date
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              Contact
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              From
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              To
            </th>
            <th
              className="px-4 py-3 text-left font-semibold"
              style={{ color: theme.text }}
            >
              Product
            </th>
            <th
              className="px-4 py-3 text-right font-semibold"
              style={{ color: theme.text }}
            >
              Qty
            </th>
            <th
              className="px-4 py-3 text-center font-semibold"
              style={{ color: theme.text }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filteredRows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-8 text-center"
                style={{ color: theme.textLight }}
              >
                No internal adjustments found
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr
                key={row.id}
                className="border-t hover:bg-opacity-50"
                style={{ borderColor: theme.border, backgroundColor: 'white' }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DirectionIndicator
                      fromId={row.fromWarehouseId}
                      toId={row.toWarehouseId}
                    />
                    <span className="font-medium" style={{ color: theme.text }}>
                      {row.reference}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: theme.textLight }}>
                  {row.date}
                </td>
                <td className="px-4 py-3" style={{ color: theme.text }}>
                  {row.contact}
                </td>
                <td className="px-4 py-3" style={{ color: theme.textLight }}>
                  {row.fromWarehouseName}
                </td>
                <td className="px-4 py-3" style={{ color: theme.textLight }}>
                  {row.toWarehouseName}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium" style={{ color: theme.text }}>
                      {row.productName}
                    </div>
                    <div className="text-xs" style={{ color: theme.textLight }}>
                      {row.productSku}
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{ color: theme.text }}
                >
                  {row.quantity}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status]
        const cards = kanbanData[status] || []
        return (
          <div key={status} className="flex flex-col">
            <div
              className={`px-3 py-2 rounded-t-lg font-semibold text-sm ${config.bg} ${config.text} border ${config.border}`}
            >
              {config.label} ({cards.length})
            </div>
            <div
              className="flex-1 p-2 rounded-b-lg border border-t-0 min-h-64"
              style={{
                borderColor: theme.border,
                backgroundColor: 'rgba(255,255,255,0.5)',
              }}
            >
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : cards.length === 0 ? (
                <div
                  className="text-center py-4 text-sm"
                  style={{ color: theme.textLight }}
                >
                  No items
                </div>
              ) : (
                cards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 rounded-lg border mb-2 bg-white shadow-sm hover:shadow-md transition-shadow"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: theme.text }}
                      >
                        {card.reference}
                      </span>
                      <DirectionIndicator
                        fromId={card.fromWarehouseId}
                        toId={card.toWarehouseId}
                      />
                    </div>
                    <div
                      className="flex items-center gap-1 mb-1 text-xs"
                      style={{ color: theme.textLight }}
                    >
                      <Package size={12} />
                      {card.productName}
                    </div>
                    <div className="text-xs mb-1" style={{ color: theme.text }}>
                      {card.contact}
                    </div>
                    <div className="text-xs" style={{ color: theme.textLight }}>
                      {card.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
            Internal Transfers
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: theme.textLight }}
              />
              <input
                type="text"
                placeholder="Search reference or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent"
                style={{
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: 'white',
                }}
              />
            </div>
            <button
              onClick={() =>
                setViewMode(viewMode === 'list' ? 'kanban' : 'list')
              }
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: 'white',
              }}
            >
              {viewMode === 'list' ? (
                <>
                  <LayoutGrid size={18} />
                  Kanban View
                </>
              ) : (
                <>
                  <List size={18} />
                  List View
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' ? renderListView() : renderKanbanView()}

        {/* Footer */}
        {!loading && (
          <div
            className="mt-4 text-sm text-center"
            style={{ color: theme.textLight }}
          >
            Showing {filteredRows.length} internal adjustment records
          </div>
        )}
      </div>
    </div>
  )
}

export default App
