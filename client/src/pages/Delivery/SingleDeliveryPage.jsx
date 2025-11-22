import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Loader2
} from 'lucide-react';

// --- API SERVICE LAYER (Integrated) ---

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleApiError = (error) => {
  if (error.response) {
    throw new Error(error.response.data.detail || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message);
  }
};

const deliveryService = {
  getById: async (id) => {
    try {
      // Fetch all deliveries and find the specific one
      const response = await api.get('/dashboard/transactions', { 
        params: { txn_type: 'delivery' } 
      });
      const delivery = response.data.find(t => t.id === parseInt(id));
      if (!delivery) throw new Error('Delivery not found');
      return delivery;
    } catch (error) {
      handleApiError(error);
    }
  },
  validate: async (id) => {
    try {
      const response = await api.post(`/products/validate_transaction/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

const warehouseService = {
  getAll: async () => {
    try {
      const response = await api.get('/warehouses/');
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch warehouses", error);
      return [];
    }
  },
};

const productService = {
  // Returns { products: [...], stock: [...] }
  getData: async () => {
    try {
      const response = await api.get('/products/');
      return {
        products: response.data[0] || [],
        stock: response.data[1] || []
      };
    } catch (error) {
      console.warn("Failed to fetch products/stock", error);
      return { products: [], stock: [] };
    }
  },
};

const userService = {
  getAll: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch users", error);
      return [];
    }
  },
};

// --- COMPONENT CODE ---

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  ready: { label: 'Ready', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  done: { label: 'Done', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  canceled: { label: 'Canceled', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

// Adjusted flow to match backend realities
const STATUS_FLOW = ['ready', 'done'];

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
  // Backend uses 'waiting' or 'ready' for initial state, mapped to 'ready' config here
  const normalizedStatus = status === 'waiting' ? 'ready' : (status || 'draft');
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
  
  return (
    <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const StatusStepper = ({ currentStatus }) => {
  const normalizedStatus = currentStatus === 'waiting' ? 'ready' : (currentStatus || 'ready');
  const currentIndex = STATUS_FLOW.indexOf(normalizedStatus);
  const isCanceled = normalizedStatus === 'canceled';

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

  // Data State
  const [transaction, setTransaction] = useState(null);
  const [transactionLines, setTransactionLines] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [allStock, setAllStock] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [txData, whData, prodData, userData] = await Promise.all([
          deliveryService.getById(id),
          warehouseService.getAll(),
          productService.getData(),
          userService.getAll(),
        ]);

        setTransaction(txData);
        setWarehouses(whData);
        setProducts(prodData.products);
        setAllStock(prodData.stock);
        setUsers(userData);

        // Adapt single transaction to lines array for UI consistency
        if (txData && txData.product_id) {
          setTransactionLines([{
            id: `line-${txData.id}`,
            product_id: txData.product_id,
            quantity: txData.quantity
          }]);
        }

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

  // IMPORTANT: Filter stock map to only show availability for the Source Warehouse
  const sourceWarehouseStockMap = useMemo(() => {
    if (!transaction) return {};
    
    return allStock
      .filter(s => s.warehouse_id === transaction.from_warehouse)
      .reduce((acc, item) => {
        // Use 'free_to_use' for accurate availability
        acc[item.product_id] = (acc[item.product_id] || 0) + (item.free_to_use || 0);
        return acc;
      }, {});
  }, [allStock, transaction]);

  const currentStatus = transaction?.status || 'ready';
  const isEditable = currentStatus === 'waiting' || currentStatus === 'ready';
  const isDone = currentStatus === 'done';
  const isCanceled = currentStatus === 'canceled';

  const handleValidate = useCallback(async () => {
    if (!isEditable) return;
    
    if(!window.confirm("Confirm delivery? This will deduct stock from the warehouse.")) return;

    setValidating(true);
    try {
      const updatedTx = await deliveryService.validate(id);
      setTransaction(updatedTx);
      alert("Delivery validated successfully. Stock updated.");
    } catch (error) {
      alert(`Validation failed: ${error.message}`);
    } finally {
      setValidating(false);
    }
  }, [isEditable, id]);

  const handleCancel = useCallback(() => {
    if (!isCanceled && !isDone) {
        // Backend doesn't support cancel yet
        alert("Cancellation not yet supported by server.");
    }
  }, [isCanceled, isDone]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBack = useCallback(() => {
    navigate('/operations/deliveries');
  }, [navigate]);

  const handleAddProduct = useCallback(() => {
    // Navigate to add product page (not implemented in MVP)
    alert("Editing lines not supported in this version.");
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#FBF8F4] pt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
      <div className="w-full h-screen bg-[#FBF8F4] pt-16 flex items-center justify-center">
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
    <div className="w-full h-screen bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                    {transaction.reference_number || `ID: ${transaction.id}`}
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge status={currentStatus} />
          </div>

          {/* Action Buttons & Status Stepper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {/* Validate Button */}
              {isEditable && !isCanceled && (
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors hover:bg-green-50 border-green-300 text-green-700 disabled:opacity-50`}
                  >
                    {validating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Validate
                  </button>
              )}
              
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <Printer size={16} />
                Print
              </button>

              {/* Cancel Button (Visual only for now) */}
              <button
                onClick={handleCancel}
                disabled={isCanceled || isDone}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                  !isCanceled && !isDone
                    ? 'hover:bg-red-50 border-red-300 text-red-700'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={
                  isCanceled || isDone
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
                  value={transaction.delivery_address || transaction.contact || "No address provided"}
                />
                <InfoField
                  icon={User}
                  label="Responsible"
                  value={userMap[transaction.created_by]}
                />
                <InfoField icon={Truck} label="Operation Type" value="Delivery" />
                <InfoField icon={Calendar} label="Schedule Date" value={new Date(transaction.scheduled_date).toLocaleString()} />
                <InfoField
                  icon={Warehouse}
                  label="Warehouse From"
                  value={warehouseMap[transaction.from_warehouse]}
                />
                {/* Deliveries usually don't have To Warehouse unless internal, but keeping for completeness */}
                {transaction.to_warehouse && (
                    <InfoField
                    icon={Warehouse}
                    label="Warehouse To"
                    value={warehouseMap[transaction.to_warehouse]}
                    />
                )}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: theme.text }}
                    title="Adding lines not supported in this version"
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
                        Availability (Source)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionLines.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-12 text-center">
                          <Package size={32} style={{ color: theme.textLight }} className="mx-auto mb-2" />
                          <p className="text-sm" style={{ color: theme.textLight }}>
                            No products added yet
                          </p>
                        </td>
                      </tr>
                    ) : (
                      transactionLines.map((line) => {
                        const product = productMap[line.product_id] || {};
                        const availableStock = sourceWarehouseStockMap[line.product_id] || 0;
                        const isInsufficient = availableStock < line.quantity && !isDone; // Only show warning if not yet done

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
                                {isDone ? (
                                     <span className="text-xs font-medium text-green-600">Processed</span>
                                ) : isInsufficient ? (
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