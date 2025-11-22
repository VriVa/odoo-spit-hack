import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft,
  Check,
  Printer,
  X,
  Plus,
  Package,
  Calendar,
  User,
  FileText,
  Warehouse as WarehouseIcon,
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

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    throw new Error(error.response.data.detail || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message);
  }
};

// Service Wrappers
const receiptService = {
  getById: async (id) => {
    try {
      // Note: Since backend doesn't have a specific GET /id endpoint yet,
      // we fetch all receipts and filter client-side.
      const response = await api.get('/dashboard/transactions', { 
        params: { txn_type: 'receipt' } 
      });
      const receipt = response.data.find(t => t.id === parseInt(id));
      if (!receipt) throw new Error('Receipt not found');
      return receipt;
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
      // Return empty if failed to avoid page crash
      console.warn("Failed to fetch warehouses", error);
      return [];
    }
  },
};

const productService = {
  getData: async () => {
    try {
      const response = await api.get('/products/');
      // Backend returns [products, stock]
      return { products: response.data[0] || [] };
    } catch (error) {
      console.warn("Failed to fetch products", error);
      return { products: [] };
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

// Status Flow Component
const StatusFlow = ({ currentStatus }) => {
  // Map backend statuses to UI steps
  // Backend: waiting (Ready), ready (Ready), done (Done)
  const steps = [
    { key: 'draft', label: 'Draft' }, // 'waiting' acts as draft/ready in this logic
    { key: 'ready', label: 'Ready' }, 
    { key: 'done', label: 'Done' }
  ];

  // Normalize backend status to flow steps
  const normalizeStatus = (status) => {
    if (status === 'waiting') return 'draft'; // Treat waiting as first step
    if (status === 'ready') return 'ready';
    if (status === 'done') return 'done';
    return 'draft';
  };

  const normalizedCurrent = normalizeStatus(currentStatus);

  const getStepIndex = (status) => {
    const index = steps.findIndex(s => s.key === status);
    return index !== -1 ? index : 0;
  };

  const currentIndex = getStepIndex(normalizedCurrent);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = step.key === normalizedCurrent;
        
        return (
          <React.Fragment key={step.key}>
            <div className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isCurrent 
                ? 'bg-[#5D4037] text-[#F5F0EC] shadow-sm' 
                : isActive 
                  ? 'bg-[#8D6E63] text-[#F5F0EC]'
                  : 'bg-[#D7CCC8] text-[#8D6E63]'
              }
            `}>
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${isActive ? 'bg-[#8D6E63]' : 'bg-[#D7CCC8]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Info Row Component
const InfoRow = ({ icon: Icon, label, value, isLoading }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs text-[#8D6E63] font-medium uppercase">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    {isLoading ? (
      <div className="h-5 bg-[#D7CCC8] rounded animate-pulse w-32"></div>
    ) : (
      <div className="text-sm text-[#3E2723] font-medium">
        {value || '-'}
      </div>
    )}
  </div>
);

// Loading Skeleton
const PageSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-[#D7CCC8] rounded w-48 animate-pulse"></div>
      <div className="h-10 bg-[#D7CCC8] rounded w-64 animate-pulse"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-10 bg-[#D7CCC8] rounded w-24 animate-pulse"></div>
      <div className="h-10 bg-[#D7CCC8] rounded w-24 animate-pulse"></div>
      <div className="h-10 bg-[#D7CCC8] rounded w-24 animate-pulse"></div>
    </div>
    <div className="bg-white rounded-xl border border-[#D7CCC8] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-[#D7CCC8] rounded w-24 animate-pulse"></div>
            <div className="h-5 bg-[#D7CCC8] rounded w-40 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl border border-[#D7CCC8] p-6">
      <div className="h-6 bg-[#D7CCC8] rounded w-32 animate-pulse mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-[#D7CCC8] rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  </div>
);

// Main Receipt Single Page
const SingleReceiptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [receipt, setReceipt] = useState(null);
  const [lines, setLines] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadReceiptData();
  }, [id]);

  const loadReceiptData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [receiptData, warehousesData, productData, usersData] = await Promise.all([
        receiptService.getById(id),
        warehouseService.getAll(),
        productService.getData(),
        userService.getAll()
      ]);

      setReceipt(receiptData);
      setWarehouses(warehousesData);
      setProducts(productData.products);
      setUsers(usersData);

      // Construct "lines" from the single transaction entry
      // Current backend MVP stores product/qty directly on the transaction
      if (receiptData && receiptData.product_id) {
        setLines([{
          id: `line-${receiptData.id}`,
          product_id: receiptData.product_id,
          quantity: receiptData.quantity
        }]);
      } else {
        setLines([]);
      }

    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown';
  };

  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? `[${product.sku || 'SKU'}] ${product.name}` : `Product #${productId}`;
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.name) : 'System';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Actions
  const handleValidate = async () => {
    if (!window.confirm('Are you sure you want to validate this receipt? This will update stock levels.')) return;
    
    setValidating(true);
    try {
      const updatedReceipt = await receiptService.validate(id);
      setReceipt(updatedReceipt);
      // Since validation updates stock, we don't strictly need to reload everything, 
      // but updating the local receipt object is crucial.
      alert("Receipt validated successfully! Stock has been updated.");
    } catch (error) {
      alert(`Validation failed: ${error.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/operations/receipts');
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#FBF8F4] pt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="w-full h-screen bg-[#FBF8F4] pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#3E2723] mb-2">Receipt not found</h2>
          <button 
            onClick={handleBack}
            className="text-sm text-[#5D4037] hover:underline"
          >
            Back to receipts
          </button>
        </div>
      </div>
    );
  }

  const isCanceled = receipt.status === 'canceled'; // Backend doesn't have cancel yet, but good for future
  const isReady = receipt.status === 'ready';
  const isDone = receipt.status === 'done';

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white rounded-lg transition-colors border border-[#D7CCC8]"
            >
              <ArrowLeft size={20} className="text-[#5D4037]" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723]">Receipt</h1>
              <p className="text-sm text-[#8D6E63] mt-0.5">{receipt.reference_number || `ID: ${receipt.id}`}</p>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isReady && !isCanceled && (
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex items-center gap-2 px-4 py-2 bg-[#8E8D4F] text-white rounded-lg text-sm font-medium hover:bg-[#7A7842] transition-colors disabled:opacity-50"
              >
                {validating ? <Loader2 size={18} className="animate-spin"/> : <Check size={18} />}
                <span>{validating ? 'Validating...' : 'Validate'}</span>
              </button>
            )}
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#5D4037] border border-[#D7CCC8] rounded-lg text-sm font-medium hover:bg-[#FBF8F4] transition-colors"
            >
              <Printer size={18} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Status Flow */}
        <div className="mb-6">
          <StatusFlow currentStatus={receipt.status} />
        </div>

        {/* Receipt Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#3E2723] mb-6 flex items-center gap-2">
            <FileText size={20} />
            Receipt Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <InfoRow 
                icon={FileText}
                label="Reference Number"
                value={receipt.reference_number}
              />
              
              <InfoRow 
                icon={User}
                label="Receive From"
                value={receipt.contact || receipt.supplier || "Unknown Supplier"}
              />
              
              <InfoRow 
                icon={User}
                label="Responsible"
                value={getUserName(receipt.created_by)}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <InfoRow 
                icon={Calendar}
                label="Scheduled Date"
                value={formatDate(receipt.scheduled_date)}
              />
              
              {/* Backend Receipt only has 'to_warehouse', from is External/Vendor usually */}
              <InfoRow 
                icon={WarehouseIcon}
                label="Destination Warehouse"
                value={getWarehouseName(receipt.to_warehouse)}
              />

               {/* Show status as text for clarity */}
               <InfoRow 
                icon={Check}
                label="Status"
                value={receipt.status.toUpperCase()}
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#3E2723] flex items-center gap-2">
              <Package size={20} />
              Products
            </h2>
            {/* Hide Add button if done or if we are in Single-Product-Mode MVP */}
            {!isDone && !isCanceled && (
              <div className="text-xs text-[#8D6E63] italic">
                 (Editing lines not supported in this version)
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FBF8F4] border-b border-[#D7CCC8]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#5D4037] uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7CCC8]">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-4 py-8 text-center text-sm text-[#8D6E63]">
                      No products found for this receipt
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="hover:bg-[#FBF8F4]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-[#8D6E63]" />
                          <span className="text-sm text-[#3E2723]">
                            {getProductInfo(line.product_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-[#3E2723]">
                          {line.quantity.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {lines.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#8D6E63]">
                No products found
              </div>
            ) : (
              lines.map((line) => (
                <div 
                  key={line.id}
                  className="bg-[#FBF8F4] border border-[#D7CCC8] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <Package size={16} className="text-[#8D6E63] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#3E2723]">
                        {getProductInfo(line.product_id)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#8D6E63] mb-1">Quantity</div>
                      <div className="text-sm font-semibold text-[#3E2723]">
                        {line.quantity.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total Summary */}
          {lines.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#D7CCC8]">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#3E2723]">
                  Total Items
                </span>
                <span className="text-lg font-bold text-[#5D4037]">
                  {lines.reduce((sum, line) => sum + line.quantity, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleReceiptPage;