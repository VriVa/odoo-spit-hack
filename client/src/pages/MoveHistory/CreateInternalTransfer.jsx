import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Warehouse,
  Package,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

// --- Configuration & Theme ---

const THEME = {
  bg: '#FBF8F4',
  text: '#3E2723',
  textLight: '#5D4037',
  border: '#D7CCC8',
  primary: '#8D6E63',
  white: '#FFFFFF',
  success: '#4CAF50',
  danger: '#D32F2F',
}

const API_BASE_URL = 'http://localhost:8000'

// --- Helper Components ---

const InputGroup = ({ label, children, icon: Icon }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label
      className="text-sm font-semibold flex items-center gap-2"
      style={{ color: THEME.text }}
    >
      {Icon && <Icon size={16} className="text-[#8D6E63]" />}
      {label}
    </label>
    {children}
  </div>
)

const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#8D6E63] appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
      style={{ borderColor: THEME.border, color: THEME.text }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
      <ArrowRight size={14} className="rotate-90" />
    </div>
  </div>
)

// --- Main Component ---

const CreateInternalTransfer = () => {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState(null)

  // Data State
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [stockMap, setStockMap] = useState({}) // Mapping of productID -> warehouseID -> quantity

  // Form State
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: '',
    scheduledDate: new Date().toISOString().split('T')[0], // Default today
  })

  // --- Fetch Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [whRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/warehouses/`),
          fetch(`${API_BASE_URL}/products/`),
        ])

        if (whRes.ok && prodRes.ok) {
          const whData = await whRes.json()
          const prodDataRaw = await prodRes.json()

          // Handle [products, stock] structure from productManager.py
          const productsList = Array.isArray(prodDataRaw) ? prodDataRaw[0] : []
          const stockList = Array.isArray(prodDataRaw) ? prodDataRaw[1] : []

          setWarehouses(whData)
          setProducts(productsList)

          // Build a quick lookup map for stock: stockMap[productId][warehouseId] = qty
          const map = {}
          stockList.forEach((item) => {
            if (!map[item.product_id]) map[item.product_id] = {}
            map[item.product_id][item.warehouse_id] = item.free_to_use
          })
          setStockMap(map)
        }
      } catch (err) {
        console.error('Failed to load data', err)
        setMessage({
          type: 'error',
          text: 'Failed to load warehouses or products. Is the server running?',
        })
      } finally {
        setFetching(false)
      }
    }
    loadData()
  }, [])

  // --- Computed ---

  const availableStock = useMemo(() => {
    if (!formData.productId || !formData.fromWarehouseId) return 0
    const prodStock = stockMap[formData.productId]
    return prodStock ? prodStock[formData.fromWarehouseId] || 0 : 0
  }, [formData.productId, formData.fromWarehouseId, stockMap])

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: w.name, value: w.id })),
    [warehouses]
  )

  const productOptions = useMemo(
    () => products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id })),
    [products]
  )

  // --- Handlers ---

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Basic Validation
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      setMessage({
        type: 'error',
        text: 'Source and Destination warehouses cannot be the same.',
      })
      setLoading(false)
      return
    }

    if (parseFloat(formData.quantity) > availableStock) {
      setMessage({
        type: 'error',
        text: `Insufficient stock. Only ${availableStock} available.`,
      })
      setLoading(false)
      return
    }

    try {
      // Construct Query Parameters for FastAPI
      const params = new URLSearchParams({
        product_id: formData.productId,
        quantity: formData.quantity,
        from_warehouse_id: formData.fromWarehouseId,
        to_warehouse_id: formData.toWarehouseId,
        scheduled_date: formData.scheduledDate,
      })

      const res = await fetch(
        `${API_BASE_URL}/products/create_internal_transfer/?${params.toString()}`,
        {
          method: 'POST',
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Transfer failed')
      }

      setMessage({
        type: 'success',
        text: 'Internal transfer created successfully!',
      })
      // Reset specific fields but keep warehouses for easier repeated entry
      setFormData((prev) => ({ ...prev, productId: '', quantity: '' }))

      // Ideally, we'd re-fetch stock here to update the available count
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // Assuming simple navigation or use history if router available
    window.location.href = '/operations/internal'
  }

  if (fetching)
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBF8F4]">
        <RefreshCw className="animate-spin text-[#8D6E63]" />
      </div>
    )

  return (
    <div className="w-full min-h-screen bg-[#FBF8F4] pt-16 px-4 pb-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#D7CCC8] transition-all"
          >
            <ArrowLeft size={24} color={THEME.text} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: THEME.text }}>
              New Internal Transfer
            </h1>
            <p className="text-sm" style={{ color: THEME.textLight }}>
              Move stock between warehouse locations
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Form Card */}
        <div
          className="bg-white rounded-xl shadow-sm border p-6 md:p-8"
          style={{ borderColor: THEME.border }}
        >
          <form onSubmit={handleSubmit}>
            {/* Location Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputGroup label="From Warehouse" icon={Warehouse}>
                <Select
                  value={formData.fromWarehouseId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fromWarehouseId: e.target.value,
                    })
                  }
                  options={warehouseOptions}
                  placeholder="Source Location"
                />
              </InputGroup>

              <InputGroup label="To Warehouse" icon={Warehouse}>
                <Select
                  value={formData.toWarehouseId}
                  onChange={(e) =>
                    setFormData({ ...formData, toWarehouseId: e.target.value })
                  }
                  options={warehouseOptions}
                  placeholder="Destination Location"
                />
              </InputGroup>
            </div>

            {/* Arrow Visual */}
            <div className="flex justify-center mb-6 -mt-2">
              <div
                className="bg-[#FBF8F4] p-2 rounded-full border"
                style={{ borderColor: THEME.border }}
              >
                <ArrowRight
                  size={20}
                  className="text-[#8D6E63] rotate-90 md:rotate-0"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6 mb-8">
              <InputGroup label="Product" icon={Package}>
                <Select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  options={productOptions}
                  placeholder="Select Item to Move"
                />
                {formData.productId && formData.fromWarehouseId && (
                  <div
                    className="text-xs mt-1.5 flex items-center gap-1"
                    style={{
                      color: availableStock > 0 ? THEME.success : THEME.danger,
                    }}
                  >
                    <CheckCircle2 size={12} />
                    Available at source: <strong>{availableStock} units</strong>
                  </div>
                )}
              </InputGroup>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Quantity" icon={RefreshCw}>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent font-mono"
                    style={{ borderColor: THEME.border }}
                    placeholder="0.00"
                  />
                </InputGroup>

                <InputGroup label="Scheduled Date" icon={Calendar}>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent"
                    style={{ borderColor: THEME.border }}
                  />
                </InputGroup>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              className="pt-6 border-t flex flex-col-reverse md:flex-row justify-end gap-4"
              style={{ borderColor: THEME.border }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 rounded-lg font-medium text-[#5D4037] hover:bg-[#FBF8F4] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.fromWarehouseId ||
                  !formData.toWarehouseId ||
                  !formData.productId ||
                  !formData.quantity
                }
                className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: THEME.primary }}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Create Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateInternalTransfer
