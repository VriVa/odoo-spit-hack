import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Package,
  AlertCircle,
  CheckCircle2,
  Warehouse,
  DollarSign,
  Filter,
  ArrowUpDown,
  Settings,
} from 'lucide-react'

// --- Configuration & Theme ---

const THEME = {
  bg: '#FBF8F4',
  text: '#3E2723',
  textLight: '#5D4037',
  border: '#D7CCC8',
  primary: '#8D6E63',
  accent: '#4E342E',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
}

const LOW_STOCK_THRESHOLD = 10

// --- Helper Components ---

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div
          className="h-4 rounded"
          style={{ backgroundColor: THEME.border, opacity: 0.3 }}
        />
      </td>
    ))}
  </tr>
)

const StockStatusBadge = ({ onHand, freeToUse }) => {
  // Logic: Warning if Free to use is low, Danger if 0 or negative
  let status = 'good'
  if (freeToUse <= 0) status = 'critical'
  else if (freeToUse < LOW_STOCK_THRESHOLD) status = 'low'

  const config = {
    good: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: CheckCircle2,
      label: 'In Stock',
    },
    low: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: AlertCircle,
      label: 'Low Stock',
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: AlertCircle,
      label: 'Out of Stock',
    },
  }[status]

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.text} border-opacity-20`}
      style={{ borderColor: 'currentColor' }}
    >
      <Icon size={12} />
      {config.label}
    </span>
  )
}

// --- Main Component ---

const StockAvailabilityPage = () => {
  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // all, low, out

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 1. Fetch Products & Stock (Endpoint returns [products, stock])
        const prodResponse = await fetch(`${API_BASE_URL}/products/`)
        // Handle non-200 responses (e.g. if backend isn't running in preview)
        if (!prodResponse.ok) throw new Error('Failed to fetch products')

        const prodDataRaw = await prodResponse.json()
        // Backend returns [products_list, stock_list] based on user's file
        const productsData = prodDataRaw[0] || []
        const stocksData = prodDataRaw[1] || []

        // 2. Fetch Warehouses
        const whResponse = await fetch(`${API_BASE_URL}/warehouses/`)
        if (!whResponse.ok) throw new Error('Failed to fetch warehouses')
        const whData = await whResponse.json()

        setProducts(productsData)
        setStocks(stocksData)
        setWarehouses(whData)
      } catch (err) {
        console.error('Failed to fetch stock data:', err)
        // Fallback for preview if backend fails
        setProducts([])
        setStocks([])
        setWarehouses([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- Data Processing ---

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, wh) => {
      acc[wh.id] = wh.name
      return acc
    }, {})
  }, [warehouses])

  const inventoryRows = useMemo(() => {
    if (!products.length) return []

    return products.map((product) => {
      // Filter stock entries for this product
      const productStocks = stocks.filter((s) => s.product_id === product.id)

      // Calculate Totals based on Selected Warehouse
      let relevantStocks = productStocks
      if (selectedWarehouse !== 'all') {
        relevantStocks = productStocks.filter(
          (s) => s.warehouse_id.toString() === selectedWarehouse
        )
      }

      const totalOnHand = relevantStocks.reduce(
        (sum, s) => sum + (s.on_hand || 0),
        0
      )
      const totalFree = relevantStocks.reduce(
        (sum, s) => sum + (s.free_to_use || 0),
        0
      )

      // If filtering by specific warehouse, use that cost, otherwise average or first found cost?
      // For simplicity, we'll use the product's base cost from the first relevant stock record or 0
      const unitCost =
        relevantStocks.length > 0 ? relevantStocks[0].product_unit_cost || 0 : 0
      const totalValue = totalOnHand * unitCost

      // Determine which warehouses hold this item (for display)
      const locationIds = [
        ...new Set(relevantStocks.map((s) => s.warehouse_id)),
      ]
      const locationNames = locationIds
        .map((id) => warehouseMap[id])
        .filter(Boolean)
        .join(', ')

      return {
        ...product,
        totalOnHand,
        totalFree,
        unitCost,
        totalValue,
        locationNames: locationNames || 'No Stock',
        locationCount: locationIds.length,
      }
    })
  }, [products, stocks, selectedWarehouse, warehouseMap])

  const filteredRows = useMemo(() => {
    let data = inventoryRows

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (row) =>
          row.name?.toLowerCase().includes(query) ||
          row.sku?.toLowerCase().includes(query) ||
          row.category?.toLowerCase().includes(query)
      )
    }

    // 2. Status Filter
    if (stockFilter === 'low') {
      data = data.filter(
        (row) => row.totalFree < LOW_STOCK_THRESHOLD && row.totalFree > 0
      )
    } else if (stockFilter === 'out') {
      data = data.filter((row) => row.totalFree <= 0)
    }

    return data
  }, [inventoryRows, searchQuery, stockFilter])

  // --- Render ---

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16 overflow-hidden font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 h-full overflow-y-auto flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: THEME.text }}
              >
                Stock Availability
              </h1>
              <p className="text-sm" style={{ color: THEME.textLight }}>
                Overview of inventory levels across all locations.
              </p>
            </div>

            {/* KPI Cards (Mini) */}
            {!loading && (
              <div className="flex gap-3">
                <div
                  className="bg-white px-4 py-2 rounded-lg border shadow-sm flex flex-col items-center min-w-[100px]"
                  style={{ borderColor: THEME.border }}
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Total Items
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: THEME.text }}
                  >
                    {inventoryRows.length}
                  </span>
                </div>
                <div
                  className="bg-white px-4 py-2 rounded-lg border shadow-sm flex flex-col items-center min-w-[100px]"
                  style={{ borderColor: THEME.border }}
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Total Value
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: THEME.success }}
                  >
                    $
                    {inventoryRows
                      .reduce((acc, r) => acc + r.totalValue, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls Toolbar */}
          <div
            className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-xl border shadow-sm"
            style={{ borderColor: THEME.border }}
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={18}
                color={THEME.textLight}
              />
              <input
                type="text"
                placeholder="Search products, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent transition-all"
                style={{ borderColor: THEME.border, color: THEME.text }}
              />
            </div>

            {/* Warehouse Filter */}
            <div className="flex items-center gap-2 md:w-64">
              <Warehouse size={18} color={THEME.textLight} />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="flex-1 py-2 pl-2 pr-8 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                style={{ borderColor: THEME.border, color: THEME.text }}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} color={THEME.textLight} />
              <div
                className="flex rounded-lg border overflow-hidden p-1 gap-1 bg-gray-50"
                style={{ borderColor: THEME.border }}
              >
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    stockFilter === 'all'
                      ? 'bg-white shadow-sm text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockFilter('low')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    stockFilter === 'low'
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Low
                </button>
                <button
                  onClick={() => setStockFilter('out')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    stockFilter === 'out'
                      ? 'bg-red-100 text-red-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Out
                </button>
              </div>
            </div>

            {/* Product Operations Button */}
            <button
              onClick={() => (window.location.href = '/product-operations')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all whitespace-nowrap md:ml-auto lg:ml-0"
              style={{ backgroundColor: THEME.primary }}
            >
              <Settings size={18} />
              <span>Product Operations</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div
          className="flex-1 overflow-hidden rounded-xl border shadow-sm bg-white flex flex-col"
          style={{ borderColor: THEME.border }}
        >
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead
                className="bg-[#F5F0EB] sticky top-0 z-10"
                style={{ color: THEME.text }}
              >
                <tr>
                  <th
                    className="px-4 py-3 font-semibold border-b"
                    style={{ borderColor: THEME.border }}
                  >
                    Product
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b"
                    style={{ borderColor: THEME.border }}
                  >
                    Category
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b hidden md:table-cell"
                    style={{ borderColor: THEME.border }}
                  >
                    Cost
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b hidden lg:table-cell"
                    style={{ borderColor: THEME.border }}
                  >
                    Locations
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b text-right"
                    style={{ borderColor: THEME.border }}
                  >
                    On Hand
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b text-right"
                    style={{ borderColor: THEME.border }}
                  >
                    Free To Use
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b text-right hidden md:table-cell"
                    style={{ borderColor: THEME.border }}
                  >
                    Value
                  </th>
                  <th
                    className="px-4 py-3 font-semibold border-b text-center"
                    style={{ borderColor: THEME.border }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: THEME.border }}>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package size={48} className="mb-2 opacity-20" />
                        <p>No products found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#FBF8F4] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span
                            className="font-medium text-base"
                            style={{ color: THEME.text }}
                          >
                            {row.name}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            SKU: {row.sku}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: THEME.textLight }}
                      >
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">
                          {row.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell"
                        style={{ color: THEME.textLight }}
                      >
                        ${row.unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: THEME.textLight }}
                        >
                          {selectedWarehouse === 'all' &&
                          row.locationCount > 1 ? (
                            <span className="italic text-gray-500">
                              Multiple Locations ({row.locationCount})
                            </span>
                          ) : (
                            row.locationNames
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono"
                        style={{ color: THEME.textLight }}
                      >
                        {row.totalOnHand}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono font-semibold"
                        style={{ color: THEME.text }}
                      >
                        {row.totalFree}
                      </td>
                      <td
                        className="px-4 py-3 text-right hidden md:table-cell"
                        style={{ color: THEME.textLight }}
                      >
                        ${row.totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StockStatusBadge
                          onHand={row.totalOnHand}
                          freeToUse={row.totalFree}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Footer Summary */}
          <div
            className="px-4 py-3 border-t bg-gray-50 text-xs text-right text-gray-500 flex justify-between items-center"
            style={{ borderColor: THEME.border }}
          >
            <span>Prices based on Last Cost</span>
            <span>Showing {filteredRows.length} products</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockAvailabilityPage
