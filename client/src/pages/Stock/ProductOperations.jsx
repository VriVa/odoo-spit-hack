import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Save,
  Package,
  Warehouse,
  DollarSign,
  RefreshCw,
  Search,
  Settings,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

// --- Configuration & Theme (Matching Previous Pages) ---

const THEME = {
  bg: '#FBF8F4',
  text: '#3E2723',
  textLight: '#5D4037',
  border: '#D7CCC8',
  primary: '#8D6E63',
  primaryHover: '#795548',
  accent: '#4E342E',
  white: '#FFFFFF',
  success: '#4CAF50',
}

// --- UI Components ---

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
      active
        ? 'border-[#8D6E63] text-[#3E2723] bg-[#F5F0EB]'
        : 'border-transparent text-[#5D4037] hover:bg-white/50'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
)

const InputGroup = ({ label, children, subLabel }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-semibold" style={{ color: THEME.text }}>
      {label}
    </label>
    {children}
    {subLabel && <span className="text-xs text-gray-500">{subLabel}</span>}
  </div>
)

const Select = ({ value, onChange, options, placeholder = 'Select...' }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#8D6E63] appearance-none cursor-pointer"
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

const ProductOperations = () => {
  const [activeTab, setActiveTab] = useState('create') // 'create' | 'update'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: '' }

  // Data State
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])

  // Form States
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    initialWarehouseId: '',
    initialQty: 0,
  })

  const [updateForm, setUpdateForm] = useState({
    productId: '',
    warehouseId: '',
    type: 'stock', // 'stock' | 'cost'
    newValue: 0,
  })

  const API_BASE_URL = 'http://localhost:8000'

  // --- Data Fetching ---

  const fetchInitialData = async () => {
    try {
      // Fetch Warehouses
      const whRes = await fetch(`${API_BASE_URL}/warehouses/`)
      if (whRes.ok) setWarehouses(await whRes.json())

      // Fetch Products
      const prodRes = await fetch(`${API_BASE_URL}/products/`)
      if (prodRes.ok) {
        const data = await prodRes.json()
        // Handle format [products, stocks] or just products
        const prodList =
          Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data
        setProducts(prodList)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // --- Handlers ---

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const payload = {
        product: {
          name: newProduct.name,
          sku: newProduct.sku,
          category: newProduct.category,
          description: newProduct.description,
          // Assuming product model might take price/cost, usually managed in stock but passing just in case
        },
        warehouse_id: parseInt(newProduct.initialWarehouseId),
        quantity: parseFloat(newProduct.initialQty),
      }

      const res = await fetch(
        `${API_BASE_URL}/products/?warehouse_id=${payload.warehouse_id}&quantity=${payload.quantity}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload.product),
        }
      )

      if (!res.ok) throw new Error('Failed to create product')

      setMessage({
        type: 'success',
        text: `Product "${newProduct.name}" created successfully!`,
      })
      setNewProduct({
        name: '',
        sku: '',
        category: '',
        description: '',
        price: 0,
        initialWarehouseId: '',
        initialQty: 0,
      })
      fetchInitialData() // Refresh lists
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Error creating product. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Construct query params based on update type
      let url = `${API_BASE_URL}/products/update_cost_stock/?product_id=${updateForm.productId}`

      if (updateForm.warehouseId) {
        url += `&warehouse_id=${updateForm.warehouseId}`
      }

      if (updateForm.type === 'stock') {
        url += `&on_hand=${updateForm.newValue}&free_to_use=${updateForm.newValue}`
      } else {
        url += `&product_unit_cost=${updateForm.newValue}`
      }

      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) throw new Error('Update failed')

      setMessage({ type: 'success', text: 'Update applied successfully!' })
      setUpdateForm({ ...updateForm, newValue: 0 })
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to update. Ensure Warehouse is selected for stock updates.',
      })
    } finally {
      setLoading(false)
    }
  }

  // --- Renders ---

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: w.name, value: w.id })),
    [warehouses]
  )

  const productOptions = useMemo(
    () => products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id })),
    [products]
  )

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16 overflow-hidden font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 h-full overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: THEME.text }}>
            Operations Center
          </h1>
          <p style={{ color: THEME.textLight }}>
            Manage your product catalog and inventory levels.
          </p>
        </div>

        {/* Notification Banner */}
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

        <div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          style={{ borderColor: THEME.border }}
        >
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: THEME.border }}>
            <TabButton
              active={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
              icon={Plus}
              label="New Product"
            />
            <TabButton
              active={activeTab === 'update'}
              onClick={() => setActiveTab('update')}
              icon={Settings}
              label="Update Inventory"
            />
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">
            {/* --- CREATE TAB --- */}
            {activeTab === 'create' && (
              <form
                onSubmit={handleCreateProduct}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <h3
                      className="text-lg font-semibold mb-4 flex items-center gap-2"
                      style={{ color: THEME.primary }}
                    >
                      <Package size={20} /> Product Details
                    </h3>
                  </div>

                  <InputGroup label="Product Name">
                    <input
                      required
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent"
                      style={{ borderColor: THEME.border }}
                      placeholder="e.g. Industrial Steel Rod"
                    />
                  </InputGroup>

                  <InputGroup label="SKU (Stock Keeping Unit)">
                    <input
                      required
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent font-mono"
                      style={{ borderColor: THEME.border }}
                      placeholder="e.g. STL-RD-001"
                    />
                  </InputGroup>

                  <InputGroup label="Category">
                    <input
                      type="text"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent"
                      style={{ borderColor: THEME.border }}
                      placeholder="e.g. Raw Materials"
                    />
                  </InputGroup>

                  <div className="md:col-span-2">
                    <InputGroup label="Description">
                      <textarea
                        rows={2}
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent resize-none"
                        style={{ borderColor: THEME.border }}
                        placeholder="Optional product details..."
                      />
                    </InputGroup>
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <h3
                      className="text-lg font-semibold mb-4 flex items-center gap-2"
                      style={{ color: THEME.primary }}
                    >
                      <Warehouse size={20} /> Initial Stock Allocation
                    </h3>
                    <div
                      className="p-4 rounded-lg bg-[#FBF8F4] border grid grid-cols-1 md:grid-cols-2 gap-4"
                      style={{ borderColor: THEME.border }}
                    >
                      <InputGroup label="Initial Warehouse">
                        <Select
                          value={newProduct.initialWarehouseId}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              initialWarehouseId: e.target.value,
                            })
                          }
                          options={warehouseOptions}
                          placeholder="Select Warehouse..."
                        />
                      </InputGroup>
                      <InputGroup label="Starting Quantity">
                        <input
                          type="number"
                          min="0"
                          value={newProduct.initialQty}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              initialQty: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent"
                          style={{ borderColor: THEME.border }}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  Create Product
                </button>
              </form>
            )}

            {/* --- UPDATE TAB --- */}
            {activeTab === 'update' && (
              <form
                onSubmit={handleUpdateStock}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                  <p>
                    <strong>Note:</strong> Use this form to manually override
                    stock levels or update standard costs. For operational
                    movements, use the Transfers page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputGroup label="Select Product">
                      <Select
                        value={updateForm.productId}
                        onChange={(e) =>
                          setUpdateForm({
                            ...updateForm,
                            productId: e.target.value,
                          })
                        }
                        options={productOptions}
                        placeholder="Search or select product..."
                      />
                    </InputGroup>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="text-sm font-semibold block mb-2"
                      style={{ color: THEME.text }}
                    >
                      Update Type
                    </label>
                    <div className="flex gap-4">
                      <label
                        className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors ${
                          updateForm.type === 'stock'
                            ? 'bg-[#F5F0EB] border-[#8D6E63]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="updateType"
                          checked={updateForm.type === 'stock'}
                          onChange={() =>
                            setUpdateForm({ ...updateForm, type: 'stock' })
                          }
                          className="accent-[#8D6E63]"
                        />
                        <div className="flex items-center gap-2">
                          <Package size={18} className="text-gray-500" />
                          <span className="font-medium">Stock Override</span>
                        </div>
                      </label>
                      <label
                        className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors ${
                          updateForm.type === 'cost'
                            ? 'bg-[#F5F0EB] border-[#8D6E63]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="updateType"
                          checked={updateForm.type === 'cost'}
                          onChange={() =>
                            setUpdateForm({ ...updateForm, type: 'cost' })
                          }
                          className="accent-[#8D6E63]"
                        />
                        <div className="flex items-center gap-2">
                          <DollarSign size={18} className="text-gray-500" />
                          <span className="font-medium">Unit Cost</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <InputGroup
                    label="Target Warehouse"
                    subLabel={
                      updateForm.type === 'cost'
                        ? 'Optional: Leave empty to update globally'
                        : 'Required for stock updates'
                    }
                  >
                    <Select
                      value={updateForm.warehouseId}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          warehouseId: e.target.value,
                        })
                      }
                      options={warehouseOptions}
                      placeholder={
                        updateForm.type === 'cost'
                          ? 'All Warehouses (Global)'
                          : 'Select Warehouse...'
                      }
                    />
                  </InputGroup>

                  <InputGroup
                    label={
                      updateForm.type === 'stock'
                        ? 'New Quantity (On Hand)'
                        : 'New Unit Cost ($)'
                    }
                  >
                    <input
                      type="number"
                      step={updateForm.type === 'cost' ? '0.01' : '1'}
                      value={updateForm.newValue}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          newValue: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent font-mono"
                      style={{ borderColor: THEME.border }}
                    />
                  </InputGroup>
                </div>

                <div
                  className="mt-8 pt-6 border-t flex justify-end"
                  style={{ borderColor: THEME.border }}
                >
                  <button
                    disabled={
                      loading ||
                      !updateForm.productId ||
                      (updateForm.type === 'stock' && !updateForm.warehouseId)
                    }
                    type="submit"
                    className="px-8 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    Apply Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductOperations
