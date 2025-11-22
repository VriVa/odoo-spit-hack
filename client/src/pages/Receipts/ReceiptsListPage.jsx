// pages/Receipts/ReceiptsListPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Package,
  Calendar,
  User,
  Warehouse as WarehouseIcon,
  ArrowRight,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Status Badge Component
const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'draft'

  const statusConfig = {
    draft: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      label: 'Draft',
    },
    waiting: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-300',
      label: 'Waiting',
    },
    ready: {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      border: 'border-teal-300',
      label: 'Ready',
    },
    done: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      label: 'Done',
    },
    canceled: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      label: 'Canceled',
    },
  }

  const config = statusConfig[normalizedStatus] || statusConfig.draft

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  )
}

// Table Skeleton Loader
const TableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#FBF8F4] border-b border-[#D7CCC8]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              Reference
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              From (Supplier)
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              To Warehouse
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              Scheduled Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D7CCC8]">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="hover:bg-[#FBF8F4]/50">
              <td className="px-6 py-4">
                <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-24"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-32"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-32"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-28"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#D7CCC8] rounded animate-pulse w-24"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 bg-[#D7CCC8] rounded-full animate-pulse w-16"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// Empty State Component
const EmptyState = ({ searchQuery }) => (
  <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-12 text-center">
    <div className="flex justify-center mb-4">
      <div className="w-16 h-16 bg-[#FBF8F4] rounded-full flex items-center justify-center">
        <FileText size={32} className="text-[#8D6E63]" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-[#3E2723] mb-2">
      {searchQuery ? 'No receipts found' : 'No receipts yet'}
    </h3>
    <p className="text-sm text-[#8D6E63] mb-6">
      {searchQuery
        ? `No receipts match "${searchQuery}". Try a different search term.`
        : 'Get started by creating your first receipt transaction.'}
    </p>
    {!searchQuery && (
      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors">
        <Plus size={18} />
        Create First Receipt
      </button>
    )}
  </div>
)

// Main Receipts List Page Component
const ReceiptsListPage = () => {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Receipts (filter transactions by type 'receipt')
      const receiptsResponse = await fetch(
        `${API_BASE_URL}/dashboard/transactions?txn_type=receipt`
      )
      const receiptsData = await receiptsResponse.json()

      // 2. Fetch Warehouses (for mapping IDs to names)
      const warehousesResponse = await fetch(`${API_BASE_URL}/warehouses/`)
      const warehousesData = await warehousesResponse.json()

      setReceipts(receiptsData)
      setWarehouses(warehousesData)
    } catch (error) {
      console.error('Error loading receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get warehouse name by ID
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId)
    return warehouse ? warehouse.name : 'Unknown'
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter receipts based on search
  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      receipt.reference_number?.toLowerCase().includes(query) ||
      receipt.contact?.toLowerCase().includes(query) ||
      receipt.supplier?.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex)

  // Handle row click
  const handleRowClick = (receiptId) => {
    navigate(`/receipts/${receiptId}`)
  }

  // Handle new receipt
  const handleNewReceipt = () => {
    navigate('/receipts/new')
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723] flex items-center gap-3">
              <Package className="w-7 h-7 sm:w-8 sm:h-8" />
              Receipts
            </h1>
            <p className="text-sm text-[#8D6E63] mt-1">
              Manage all incoming stock receipts
            </p>
          </div>
          <button
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors active:scale-95 self-start sm:self-auto shadow-sm"
            onClick={handleNewReceipt}
          >
            <Plus size={18} />
            <span>New Receipt</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8D6E63] w-5 h-5" />
            <input
              type="text"
              placeholder="Search by reference, supplier or contact..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-[#D7CCC8] rounded-lg text-sm text-[#3E2723] placeholder-[#8D6E63] focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && <TableSkeleton />}

        {/* Empty State */}
        {!loading && filteredReceipts.length === 0 && (
          <EmptyState searchQuery={searchQuery} />
        )}

        {/* Receipts Table */}
        {!loading && filteredReceipts.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#D7CCC8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FBF8F4] border-b border-[#D7CCC8]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        From (Supplier)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        To Warehouse
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        Scheduled Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D7CCC8]">
                    {paginatedReceipts.map((receipt) => (
                      <tr
                        key={receipt.id}
                        onClick={() => handleRowClick(receipt.id)}
                        className="hover:bg-[#FBF8F4]/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-[#8D6E63]" />
                            <span className="text-sm font-medium text-[#3E2723]">
                              {receipt.reference_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#5D4037]">
                              {/* Receipts come from a Supplier. If supplier is null, check if it has a from_warehouse (rare for receipts) */}
                              {receipt.supplier ||
                                (receipt.from_warehouse
                                  ? getWarehouseName(receipt.from_warehouse)
                                  : 'External Vendor')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <WarehouseIcon
                              size={16}
                              className="text-[#8D6E63]"
                            />
                            <span className="text-sm text-[#5D4037]">
                              {getWarehouseName(receipt.to_warehouse)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-[#8D6E63]" />
                            <span className="text-sm text-[#5D4037]">
                              {receipt.contact || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-[#8D6E63]" />
                            <span className="text-sm text-[#5D4037]">
                              {formatDate(receipt.scheduled_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={receipt.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginatedReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  onClick={() => handleRowClick(receipt.id)}
                  className="bg-white rounded-lg shadow-sm border border-[#D7CCC8] p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#8D6E63]" />
                      <span className="text-sm font-semibold text-[#3E2723]">
                        {receipt.reference_number}
                      </span>
                    </div>
                    <StatusBadge status={receipt.status} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#8D6E63]">From:</span>
                      <span className="text-[#5D4037] font-medium">
                        {receipt.supplier || 'External Vendor'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <WarehouseIcon size={14} className="text-[#8D6E63]" />
                      <span className="text-[#8D6E63]">To:</span>
                      <span className="text-[#5D4037] font-medium">
                        {getWarehouseName(receipt.to_warehouse)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-[#8D6E63]" />
                      <span className="text-[#5D4037]">
                        {receipt.contact || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-[#8D6E63]" />
                      <span className="text-[#5D4037]">
                        {formatDate(receipt.scheduled_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 sm:px-0">
                <div className="text-sm text-[#8D6E63]">
                  Showing {startIndex + 1} to{' '}
                  {Math.min(endIndex, filteredReceipts.length)} of{' '}
                  {filteredReceipts.length} receipts
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-[#D7CCC8] text-[#5D4037] hover:bg-[#FBF8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[#5D4037] text-[#F5F0EC]'
                              : 'text-[#5D4037] hover:bg-[#FBF8F4]'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-[#D7CCC8] text-[#5D4037] hover:bg-[#FBF8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ReceiptsListPage
