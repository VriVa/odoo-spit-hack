import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const baseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000'

async function safeFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  // If no content
  if (res.status === 204) return null
  return res.json()
}

const SingleAdjustmentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new' || !id

  const [productsList, setProductsList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [countedQty, setCountedQty] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        // GET /products/ returns [products, stock]
        const data = await safeFetch('/products/')
        let products = []
        let stock = []
        if (Array.isArray(data) && data.length >= 1) {
          products = data[0] || []
          stock = data[1] || []
        } else if (Array.isArray(data)) {
          products = data
        } else if (data && data.products) {
          products = data.products
          stock = data.stock || []
        }

        // Try to fetch warehouses list — route may not exist; fallback to derive from stock
        let wh = []
        try {
          wh = await safeFetch('/warehouses/')
        } catch (err) {
          // derive minimal warehouse entries from stock
          const ids = Array.from(new Set((stock || []).map((s) => s.warehouse_id)))
          wh = ids.map((id) => ({ id, name: `Warehouse ${id}` }))
        }

        if (mounted) {
          setProductsList(products || [])
          setWarehouses(wh || [])
        }
      } catch (e) {
        console.error('Failed to load products/warehouses:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!productId || !warehouseId) {
      alert('Select product and warehouse')
      return
    }
    setSubmitting(true)
    try {
      const product = productsList.find((p) => Number(p.id) === Number(productId))

      // POST body: Product JSON. Query params: warehouse_id, counted_qty
      const params = new URLSearchParams({
        warehouse_id: String(Number(warehouseId)),
        counted_qty: String(Number(countedQty)),
      })

      const result = await safeFetch(`/products/adjust_stock/?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      console.log('Adjust result', result)
      navigate('/operations/adjustments')
    } catch (e) {
      console.error('Adjustment failed', e)
      alert('Adjustment failed: ' + (e.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{isNew ? 'New' : 'Adjustment'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block mb-1">Product</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full">
            <option value="">Select product</option>
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Warehouse</label>
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full">
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Counted Quantity</label>
          <input
            type="number"
            step="any"
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <button disabled={submitting} className="btn btn-primary">
            {submitting ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SingleAdjustmentPage