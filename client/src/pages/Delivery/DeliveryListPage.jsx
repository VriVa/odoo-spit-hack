import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Search, ChevronRight } from 'lucide-react';
import { getTransactionsByType, getWarehouses } from '../../services/api';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
  waiting: { label: 'Waiting', bg: 'bg-teal-100', text: 'text-teal-700' },
  ready: { label: 'Ready', bg: 'bg-amber-100', text: 'text-amber-700' },
  done: { label: 'Done', bg: 'bg-green-100', text: 'text-green-700' },
  canceled: { label: 'Canceled', bg: 'bg-red-100', text: 'text-red-700' },
};

const theme = {
  bg: '#FBF8F4',
  text: '#3E2723',
  textMedium: '#5D4037',
  textLight: '#8D6E63',
  border: '#D7CCC8',
  card: '#FFFFFF',
};

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 rounded" style={{ backgroundColor: theme.border }} />
      </td>
    ))}
  </tr>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: theme.border }}
    >
      <Truck size={32} style={{ color: theme.textLight }} />
    </div>
    <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
      No deliveries found
    </h3>
    <p className="text-sm" style={{ color: theme.textLight }}>
      Try adjusting your search or create a new delivery
    </p>
  </div>
);

const DeliveriesListPage = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deliveryData, warehouseData] = await Promise.all([
          getTransactionsByType('delivery'),
          getWarehouses(),
        ]);
        setDeliveries(deliveryData);
        setWarehouses(warehouseData);
      } catch (err) {
        console.error('Failed to fetch deliveries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, wh) => {
      acc[wh.id] = wh.name;
      return acc;
    }, {});
  }, [warehouses]);

  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return deliveries;
    const query = searchQuery.toLowerCase();
    return deliveries.filter(
      (delivery) =>
        delivery.reference_number?.toLowerCase().includes(query) ||
        delivery.contact?.toLowerCase().includes(query)
    );
  }, [deliveries, searchQuery]);

  const handleRowClick = (id) => {
    navigate(`/deliveries/${id}`);
  };

  const handleNewDelivery = () => {
    navigate('/deliveries/new');
  };

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.textMedium }}
            >
              <Truck size={20} color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
                Deliveries
              </h1>
              <p className="text-sm" style={{ color: theme.textLight }}>
                Manage outgoing delivery orders
              </p>
            </div>
          </div>
          <button
            onClick={handleNewDelivery}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-colors hover:bg-[#3E2723]"
            style={{ backgroundColor: theme.text }}
          >
            <Plus size={18} />
            New Delivery
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: theme.textLight }}
            />
            <input
              type="text"
              placeholder="Search by reference or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent"
              style={{
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.card,
              }}
            />
          </div>
        </div>

        {/* Table Card */}
        <div
          className="rounded-xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: theme.bg }}>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    Reference
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    From
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    To
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    Contact
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    Scheduled Date
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: theme.textMedium }}
                  >
                    Status
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      onClick={() => handleRowClick(delivery.id)}
                      className="border-t cursor-pointer transition-colors hover:bg-[#FBF8F4]"
                      style={{
                        borderColor: theme.border,
                      }}
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium" style={{ color: theme.text }}>
                          {delivery.reference_number}
                        </span>
                      </td>
                      <td className="px-4 py-4" style={{ color: theme.textMedium }}>
                        {warehouseMap[delivery.from_warehouse] || '-'}
                      </td>
                      <td className="px-4 py-4" style={{ color: theme.textMedium }}>
                        {warehouseMap[delivery.to_warehouse] || '-'}
                      </td>
                      <td className="px-4 py-4" style={{ color: theme.text }}>
                        {delivery.contact}
                      </td>
                      <td className="px-4 py-4" style={{ color: theme.textMedium }}>
                        {delivery.scheduled_date}
                      </td>
                      <td className="px-4 py-4">
                        <StatusChip status={delivery.status} />
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight size={18} style={{ color: theme.textLight }} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && filteredDeliveries.length > 0 && (
            <div
              className="px-4 py-3 border-t text-sm"
              style={{ borderColor: theme.border, color: theme.textLight }}
            >
              Showing {filteredDeliveries.length} of {deliveries.length} deliveries
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveriesListPage;