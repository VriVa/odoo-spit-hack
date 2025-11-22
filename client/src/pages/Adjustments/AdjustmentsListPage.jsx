import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const baseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000'

async function safeFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const AdjustmentsListPage = () => {
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await safeFetch('/dashboard/transactions?txn_type=internal_adjustment')
        if (mounted) setAdjustments(data || [])
      } catch (e) {
        console.error('Failed to load adjustments:', e)
        if (mounted) setAdjustments([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Stock Adjustments</h2>
        <Link to="/operations/adjustments/new" className="btn btn-primary">
          New Adjustment
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : adjustments.length === 0 ? (
        <div>No adjustments found.</div>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2">Reference</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.reference_number || `#${a.id}`}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">{a.status}</td>
                <td className="p-2">{a.scheduled_date || a.created_at}</td>
                <td className="p-2">
                  <Link to={`/operations/adjustments/${a.id}`} className="text-blue-600">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdjustmentsListPage