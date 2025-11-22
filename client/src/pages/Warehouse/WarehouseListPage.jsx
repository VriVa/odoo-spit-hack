import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Warehouse as WarehouseIcon,
  MapPin,
  Boxes,
  Package,
  TrendingUp,
} from 'lucide-react'

// Warehouse Card Component
const WarehouseCard = ({ warehouse, totalStock, capacity, onClick }) => {
  const utilizationPercent = (totalStock / capacity) * 100

  let utilizationColor = 'bg-[#8E8D4F]'
  if (utilizationPercent > 90) utilizationColor = 'bg-[#A0493B]'
  else if (utilizationPercent > 70) utilizationColor = 'bg-[#C68642]'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#D7CCC8] p-6 shadow-sm hover:shadow-md hover:border-[#8D6E63] transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 bg-[#FBF8F4] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#F5F0EC] transition-colors">
            <WarehouseIcon size={24} className="text-[#5D4037]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#3E2723] mb-1 truncate">
              {warehouse.name}
            </h3>
            <div className="inline-flex items-center px-2 py-1 bg-[#FBF8F4] rounded text-xs font-medium text-[#5D4037] border border-[#D7CCC8]">
              {warehouse.short_code || `WH-${warehouse.id}`}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 mb-4 text-sm text-[#8D6E63]">
        <MapPin size={16} className="flex-shrink-0" />
        <span className="truncate">
          {warehouse.location || warehouse.address || 'No address set'}
        </span>
      </div>

      {/* Stock Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#5D4037]">
            <Boxes size={16} />
            <span className="font-medium">Stock</span>
          </div>
          <span className="text-sm font-semibold text-[#3E2723]">
            {totalStock.toLocaleString()} units
          </span>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-[#8D6E63]">
            <span>Utilization</span>
            <span className="font-medium">
              {utilizationPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-[#D7CCC8] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${utilizationColor}`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8D6E63]">Capacity</span>
          <span className="font-medium text-[#5D4037]">
            {capacity.toLocaleString()} units
          </span>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton Component
const WarehouseCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-[#D7CCC8] p-6 shadow-sm">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-12 h-12 bg-[#D7CCC8] rounded-lg animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-[#D7CCC8] rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-16"></div>
      </div>
    </div>
    <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-2/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-[#D7CCC8] rounded animate-pulse"></div>
      <div className="h-2 bg-[#D7CCC8] rounded-full animate-pulse"></div>
      <div className="h-3 bg-[#D7CCC8] rounded animate-pulse w-1/2"></div>
    </div>
  </div>
)

// Empty State Component
const EmptyState = ({ searchQuery, onAddWarehouse }) => (
  <div className="col-span-full bg-white rounded-xl border border-[#D7CCC8] p-12 text-center">
    <div className="flex justify-center mb-4">
      <div className="w-20 h-20 bg-[#FBF8F4] rounded-full flex items-center justify-center">
        <WarehouseIcon size={40} className="text-[#8D6E63]" />
      </div>
    </div>
    <h3 className="text-xl font-semibold text-[#3E2723] mb-2">
      {searchQuery ? 'No warehouses found' : 'No warehouses yet'}
    </h3>
    <p className="text-sm text-[#8D6E63] mb-6 max-w-md mx-auto">
      {searchQuery
        ? `No warehouses match "${searchQuery}". Try a different search term.`
        : 'Get started by adding your first warehouse to begin managing inventory.'}
    </p>
    {!searchQuery && (
      <button
        onClick={onAddWarehouse}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors shadow-sm"
      >
        <Plus size={18} />
        Add First Warehouse
      </button>
    )}
  </div>
)

// Stats Summary Component
const StatsSummary = ({ warehouses, totalStock }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div className="bg-white rounded-lg border border-[#D7CCC8] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FBF8F4] rounded-lg flex items-center justify-center">
          <WarehouseIcon size={20} className="text-[#5D4037]" />
        </div>
        <div>
          <p className="text-xs text-[#8D6E63] font-medium">Total Warehouses</p>
          <p className="text-xl font-bold text-[#3E2723]">
            {warehouses.length}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-[#D7CCC8] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FBF8F4] rounded-lg flex items-center justify-center">
          <Package size={20} className="text-[#5D4037]" />
        </div>
        <div>
          <p className="text-xs text-[#8D6E63] font-medium">Total Stock</p>
          <p className="text-xl font-bold text-[#3E2723]">
            {totalStock.toLocaleString()}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-[#D7CCC8] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FBF8F4] rounded-lg flex items-center justify-center">
          <TrendingUp size={20} className="text-[#8E8D4F]" />
        </div>
        <div>
          <p className="text-xs text-[#8D6E63] font-medium">
            Avg Stock/Warehouse
          </p>
          <p className="text-xl font-bold text-[#3E2723]">
            {warehouses.length > 0
              ? Math.round(totalStock / warehouses.length).toLocaleString()
              : 0}
          </p>
        </div>
      </div>
    </div>
  </div>
)

// Main Warehouse List Page Component
const WarehouseListPage = () => {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch Warehouses and Stock concurrently
      const [whResponse, prodResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/warehouses/`),
        fetch(`${API_BASE_URL}/products/`),
      ])

      if (!whResponse.ok) throw new Error('Failed to fetch warehouses')
      if (!prodResponse.ok) throw new Error('Failed to fetch products')

      const warehousesData = await whResponse.json()
      const prodData = await prodResponse.json()

      // prodData is a list [products, stock], we need the stock array at index 1
      const stockData =
        Array.isArray(prodData) && prodData.length > 1 ? prodData[1] : []

      setWarehouses(warehousesData)
      setStock(stockData)
    } catch (error) {
      console.error('Error loading warehouse data:', error)
      // Fallback to empty arrays in case of error to prevent UI crash
      setWarehouses([])
      setStock([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate stock per warehouse
  const getWarehouseStock = (warehouseId) => {
    return stock
      .filter((item) => item.warehouse_id === warehouseId)
      .reduce((sum, item) => sum + (item.on_hand || 0), 0)
  }

  // Calculate total stock across all warehouses
  const totalStock = stock.reduce((sum, item) => sum + (item.on_hand || 0), 0)

  // Filter warehouses based on search
  const filteredWarehouses = warehouses.filter((warehouse) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      warehouse.name?.toLowerCase().includes(query) ||
      (warehouse.short_code &&
        warehouse.short_code.toLowerCase().includes(query)) ||
      (warehouse.address && warehouse.address.toLowerCase().includes(query)) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(query))
    )
  })

  // Prepare warehouse data with stock
  const warehousesWithStock = filteredWarehouses.map((warehouse) => ({
    ...warehouse,
    totalStock: getWarehouseStock(warehouse.id),
    // Default capacity if not provided by backend
    capacity: warehouse.capacity || 10000,
  }))

  // Handlers
  const handleWarehouseClick = (warehouseId) => {
    navigate(`/warehouses/${warehouseId}`)
  }

  const handleAddWarehouse = () => {
    navigate('/warehouses/new')
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723] flex items-center gap-3">
              <WarehouseIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              Warehouses
            </h1>
            <p className="text-sm text-[#8D6E63] mt-1">
              Manage all warehouse locations and inventory
            </p>
          </div>
          <button
            onClick={handleAddWarehouse}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors active:scale-95 self-start sm:self-auto shadow-sm"
          >
            <Plus size={18} />
            <span>Add Warehouse</span>
          </button>
        </div>

        {/* Stats Summary - Only show when not loading and has data */}
        {!loading && warehouses.length > 0 && (
          <StatsSummary
            warehouses={warehousesWithStock}
            totalStock={totalStock}
          />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8D6E63] w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, code, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#D7CCC8] rounded-lg text-sm text-[#3E2723] placeholder-[#8D6E63] focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <WarehouseCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredWarehouses.length === 0 && (
          <div className="grid grid-cols-1">
            <EmptyState
              searchQuery={searchQuery}
              onAddWarehouse={handleAddWarehouse}
            />
          </div>
        )}

        {/* Warehouse Grid */}
        {!loading && filteredWarehouses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {warehousesWithStock.map((warehouse) => (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                totalStock={warehouse.totalStock}
                capacity={warehouse.capacity}
                onClick={() => handleWarehouseClick(warehouse.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WarehouseListPage
