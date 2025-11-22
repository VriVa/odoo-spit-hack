import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Hash,
  Tag,
  AlertCircle,
} from 'lucide-react'

// Info Row Component
const InfoRow = ({ icon: Icon, label, value, isLoading }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-xs text-[#8D6E63] font-medium uppercase tracking-wide">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    {isLoading ? (
      <div className="h-6 bg-[#D7CCC8] rounded animate-pulse w-48"></div>
    ) : (
      <div className="text-base text-[#3E2723] font-semibold">
        {value || '-'}
      </div>
    )}
  </div>
)

// Location Tag Component
const LocationTag = ({ location, index }) => {
  // Generate pastel colors based on index
  const pastelColors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-yellow-100 text-yellow-700 border-yellow-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-orange-100 text-orange-700 border-orange-200',
  ]

  const colorClass = pastelColors[index % pastelColors.length]

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${colorClass}`}
    >
      <MapPin size={14} />
      <span>{location}</span>
    </div>
  )
}

// Loading Skeleton
const PageSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 bg-[#D7CCC8] rounded-lg animate-pulse"></div>
      <div className="h-8 bg-[#D7CCC8] rounded w-64 animate-pulse"></div>
    </div>

    {/* Info Card Skeleton */}
    <div className="bg-white rounded-xl border border-[#D7CCC8] p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-[#D7CCC8] rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-[#D7CCC8] rounded w-40 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Locations Skeleton */}
    <div className="bg-white rounded-xl border border-[#D7CCC8] p-6">
      <div className="h-6 bg-[#D7CCC8] rounded w-32 animate-pulse mb-4"></div>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 bg-[#D7CCC8] rounded-lg w-24 animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
)

// Empty Locations State
const EmptyLocationsState = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-16 h-16 bg-[#FBF8F4] rounded-full flex items-center justify-center mb-4">
      <MapPin size={32} className="text-[#8D6E63]" />
    </div>
    <p className="text-sm text-[#5D4037] max-w-md leading-relaxed">
      This section holds the multiple locations of this warehouse — rooms,
      racks, zones, and storage areas.
    </p>
  </div>
)

// Main Warehouse Details Page Component
const WarehouseDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [warehouse, setWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const API_BASE_URL = 'http://localhost:8000'

  useEffect(() => {
    loadWarehouseData()
  }, [id])

  const loadWarehouseData = async () => {
    setLoading(true)
    setError(false)
    try {
      // Fetch all warehouses and find the specific one
      const response = await fetch(`${API_BASE_URL}/warehouses/`)
      if (!response.ok) throw new Error('Failed to fetch warehouses')

      const warehouses = await response.json()
      const foundWarehouse = warehouses.find((w) => w.id === parseInt(id))

      if (!foundWarehouse) {
        setError(true)
      } else {
        setWarehouse(foundWarehouse)
      }
    } catch (error) {
      console.error('Error loading warehouse:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/warehouses')
  }

  // Loading State
  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FBF8F4]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageSkeleton />
        </div>
      </div>
    )
  }

  // Error State - Warehouse Not Found
  if (error || !warehouse) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FBF8F4] pt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#3E2723] mb-2">
              Warehouse Not Found
            </h2>
            <p className="text-sm text-[#8D6E63] mb-6">
              The warehouse you're looking for doesn't exist or has been
              removed.
            </p>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Warehouses
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get locations from warehouse data
  const locations = warehouse.locations || []
  const warehouseCode = warehouse.warehouse_code || warehouse.short_code || '-'

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white rounded-lg transition-colors border border-[#D7CCC8]"
          >
            <ArrowLeft size={20} className="text-[#5D4037]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FBF8F4] rounded-lg flex items-center justify-center border border-[#D7CCC8]">
              <WarehouseIcon size={24} className="text-[#5D4037]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723]">
                {warehouse.name}
              </h1>
              <p className="text-sm text-[#8D6E63] mt-0.5">Warehouse Details</p>
            </div>
          </div>
        </div>

        {/* Warehouse Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#3E2723] mb-6 flex items-center gap-2">
            <WarehouseIcon size={20} />
            Warehouse Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoRow
              icon={WarehouseIcon}
              label="Warehouse Name"
              value={warehouse.name}
            />

            <InfoRow
              icon={Tag}
              label="Short Code"
              value={warehouse.short_code}
            />

            <InfoRow icon={Hash} label="Warehouse Code" value={warehouseCode} />
          </div>

          {/* Address if available */}
          {(warehouse.address || warehouse.location) && (
            <div className="mt-6 pt-6 border-t border-[#D7CCC8]">
              <InfoRow
                icon={MapPin}
                label="Address"
                value={warehouse.address || warehouse.location}
              />
            </div>
          )}
        </div>

        {/* Locations Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-6">
          <h2 className="text-lg font-semibold text-[#3E2723] mb-6 flex items-center gap-2">
            <MapPin size={20} />
            Locations
          </h2>

          {locations.length === 0 ? (
            <EmptyLocationsState />
          ) : (
            <div className="flex flex-wrap gap-3">
              {locations.map((location, index) => (
                <LocationTag key={index} location={location} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseDetailsPage
