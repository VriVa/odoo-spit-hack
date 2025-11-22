import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Check,
  AlertTriangle,
  Plus,
  Truck,
  Printer,
  X,
  Calendar,
  MapPin,
  User,
  Warehouse,
} from 'lucide-react';
import {
  getTransaction,
  getTransactionLines,
  getWarehouses,
  getProducts,
  getUsers,
  getStock,
} from '../../services/api';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  waiting: { label: 'Waiting', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  ready: { label: 'Ready', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  done: { label: 'Done', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  canceled: { label: 'Canceled', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const STATUS_FLOW = ['draft', 'waiting', 'ready', 'done'];

const theme = {
  bg: '#FBF8F4',
  card: '#FFFFFF',
  text: '#3E2723',
  textMedium: '#5D4037',
  textLight: '#8D6E63',
  border: '#D7CCC8',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const StatusStepper = ({ currentStatus }) => {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const isCanceled = currentStatus === 'canceled';

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {STATUS_FLOW.map((status, index) => {
        const isActive = index <= currentIndex && !isCanceled;
        const config = STATUS_CONFIG[status];
        return (
          <React.Fragment key={status}>
            <span
              className={`px-2 py-1 rounded ${
                isActive ? `${config.bg} ${config.text}` : 'bg-gray-50 text-gray-400'
              }`}
            >
              {config.label}
            </span>
            {index < STATUS_FLOW.length - 1 && (
              <span style={{ color: theme.textLight }}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const InfoField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: theme.bg }}
    >
      <Icon size={16} style={{ color: theme.textMedium }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium mb-0.5" style={{ color: theme.textLight }}>
        {label}
      </p>
      <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
        {value || '-'}
      </p>
    </div>
  </div>
);

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded ${className}`} style={{ backgroundColor: theme.border }} />
);

const SingleDeliveryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [transactionLines, setTransactionLines] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localStatus, setLocalStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [txData, linesData, whData, prodData, userData, stockData] = await Promise.all([
          getTransaction(id),
          getTransactionLines(id),
          getWarehouses(),
          getProducts(),
          getUsers(),
          getStock(),
        ]);
        setTransaction(txData);
        setTransactionLines(linesData);
        setWarehouses(whData);
        setProducts(prodData);
        setUsers(userData);
        setStock(stockData);
        setLocalStatus(txData?.status);
      } catch (err) {
        console.error('Failed to fetch delivery data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, wh) => {
      acc[wh.id] = wh.name;
      return acc;
    }, {});
  }, [warehouses]);

  const productMap = useMemo(() => {
    return products.reduce((acc, prod) => {
      acc[prod.id] = { name: prod.name, sku: prod.sku, unit_cost: prod.unit_cost };
      return acc;
    }, {});
  }, [products]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.full_name || user.name;
      return acc;
    }, {});
  }, [users]);

  const stockMap = useMemo(() => {
    return stock.reduce((acc, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + (item.quantity || 0);
      return acc;
    }, {});
  }, [stock]);

  const currentStatus = localStatus || transaction?.status || 'draft';
  const isEditable = currentStatus === 'draft';
  const isCanceled = currentStatus === 'canceled';

  const handleValidate = useCallback(() => {
    if (isEditable) {
      setLocalStatus('ready');
    }
  }, [isEditable]);

  const handleCancel = useCallback(() => {
    if (!isCanceled && currentStatus !== 'done') {
      setLocalStatus('canceled');
    }
  }, [isCanceled, currentStatus]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBack = useCallback(() => {
    navigate('/deliveries');
  }, [navigate]);

  const handleAddProduct = useCallback(() => {
    navigate(`/deliveries/${id}/add-line`);
  }, [navigate, id]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-5xl mx-auto">
          <SkeletonBlock className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SkeletonBlock className="h-64 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2">
              <SkeletonBlock className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen p-4 md:p-6 flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="text-center">
          <Package size={48} style={{ color: theme.textLight }} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
            Delivery not found
          </h2>
          <button
            onClick={handleBack}
            className="text-sm font-medium underline"
            style={{ color: theme.textMedium }}
          >
            Back to deliveries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pt-16" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-lg border flex items-center justify-center transition-colors hover:bg-white"
                style={{ borderColor: theme.border }}
              >
                <ArrowLeft size={20} style={{ color: theme.text }} />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.textMedium }}
                >
                  <Truck size={20} color="white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: theme.text }}>
                    Delivery
                  </h1>
                  <p className="text-sm font-medium" style={{ color: theme.textLight }}>
                    {transaction.reference_number}
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge status={currentStatus} />
          </div>

          {/* Action Buttons & Status Stepper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleValidate}
                disabled={!isEditable}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                  isEditable
                    ? 'hover:bg-green-50 border-green-300 text-green-700'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={!isEditable ? { borderColor: theme.border, color: theme.textLight } : {}}
              >
                <Check size={16} />
                Validate
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={handleCancel}
                disabled={isCanceled || currentStatus === 'done'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                  !isCanceled && currentStatus !== 'done'
                    ? 'hover:bg-red-50 border-red-300 text-red-700'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={
                  isCanceled || currentStatus === 'done'
                    ? { borderColor: theme.border, color: theme.textLight }
                    : {}
                }
              >
                <X size={16} />
                Cancel
              </button>
            </div>
            <StatusStepper currentStatus={currentStatus} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Information Card */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl border p-5"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: theme.textMedium }}>
                Delivery Information
              </h2>
              <div className="divide-y" style={{ borderColor: theme.border }}>
                <InfoField
                  icon={MapPin}
                  label="Delivery Address"
                  value={transaction.delivery_address || transaction.contact}
                />
                <InfoField
                  icon={User}
                  label="Responsible"
                  value={userMap[transaction.created_by]}
                />
                <InfoField icon={Truck} label="Operation Type" value="Delivery" />
                <InfoField icon={Calendar} label="Schedule Date" value={transaction.scheduled_date} />
                <InfoField
                  icon={Warehouse}
                  label="Warehouse From"
                  value={warehouseMap[transaction.from_warehouse]}
                />
                <InfoField
                  icon={Warehouse}
                  label="Warehouse To"
                  value={warehouseMap[transaction.to_warehouse]}
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-2">
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <h2 className="text-sm font-semibold" style={{ color: theme.textMedium }}>
                  Products
                </h2>
                {isEditable && (
                  <button
                    onClick={handleAddProduct}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: theme.text }}
                  >
                    <Plus size={14} />
                    Add Product
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: theme.bg }}>
                      <th className="px-5 py-3 text-left font-semibold" style={{ color: theme.textMedium }}>
                        Product
                      </th>
                      <th className="px-5 py-3 text-right font-semibold" style={{ color: theme.textMedium }}>
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-center font-semibold" style={{ color: theme.textMedium }}>
                        Stock
                      </th>
                      <th className="px-5 py-3 text-right font-semibold" style={{ color: theme.textMedium }}>
                        Unit Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionLines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center">
                          <Package size={32} style={{ color: theme.textLight }} className="mx-auto mb-2" />
                          <p className="text-sm" style={{ color: theme.textLight }}>
                            No products added yet
                          </p>
                        </td>
                      </tr>
                    ) : (
                      transactionLines.map((line) => {
                        const product = productMap[line.product_id] || {};
                        const availableStock = stockMap[line.product_id] || 0;
                        const isInsufficient = availableStock < line.quantity;

                        return (
                          <tr
                            key={line.id}
                            className="border-t"
                            style={{
                              borderColor: theme.border,
                              backgroundColor: isInsufficient ? theme.dangerBg : 'transparent',
                            }}
                          >
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium" style={{ color: theme.text }}>
                                  {product.name || 'Unknown Product'}
                                </p>
                                <p className="text-xs" style={{ color: theme.textLight }}>
                                  {product.sku || '-'}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold" style={{ color: theme.text }}>
                              {line.quantity}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                {isInsufficient ? (
                                  <>
                                    <AlertTriangle size={14} style={{ color: theme.danger }} />
                                    <span className="text-xs font-medium" style={{ color: theme.danger }}>
                                      Insufficient ({availableStock})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} className="text-green-600" />
                                    <span className="text-xs font-medium text-green-600">
                                      Available ({availableStock})
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right" style={{ color: theme.textMedium }}>
                              {product.unit_cost ? `$${product.unit_cost.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {transactionLines.length > 0 && (
                <div
                  className="px-5 py-3 text-sm"
                  style={{ borderTop: `1px solid ${theme.border}`, color: theme.textLight }}
                >
                  {transactionLines.length} product{transactionLines.length !== 1 ? 's' : ''} in this delivery
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleDeliveryPage;