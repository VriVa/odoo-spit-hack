import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  Warehouse,
  Calendar,
  User,
  Truck,
  AlertTriangle,
  Check,
  Loader2,
  Info,
  ClipboardList,
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

const warehouseService = {
  getAll: async () => {
    try {
      const response = await api.get('/warehouses/');
      return response.data;
    } catch (error) {
      handleApiError(error);
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

const productService = {
  getData: async () => {
    try {
      const response = await api.get('/products/');
      // Backend returns [products, stock]
      return {
        products: response.data[0] || [],
        stock: response.data[1] || []
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  createReceipt: async (data) => {
    try {
      // Backend expects Query Params for this specific endpoint
      const params = {
        product_id: data.product_id,
        supplier: data.supplier,
        quantity: data.quantity,
        to_warehouse_id: data.to_warehouse_id,
        scheduled_date: data.scheduled_date, // ISO String
        user_id: data.user_id,
      };

      // POST with null body, data in params
      const response = await api.post('/products/create_receipt/', null, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

// --- COMPONENT CODE ---

const theme = {
  bg: '#FBF8F4',
  card: '#FFFFFF',
  text: '#3E2723',
  textMedium: '#5D4037',
  textLight: '#8D6E63',
  border: '#D7CCC8',
  inputBg: '#FFFCF9',
  button: '#5D4037',
  buttonHover: '#3E2723',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  success: '#16A34A',
  successBg: '#F0FDF4',
  infoBg: '#FFF8E1',
  infoBorder: '#FFE082',
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? theme.successBg : theme.dangerBg;
  const textColor = isSuccess ? theme.success : theme.danger;
  const Icon = isSuccess ? Check : AlertTriangle;

  return (
    <div
      className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border"
      style={{ backgroundColor: bgColor, borderColor: textColor }}
    >
      <Icon size={18} style={{ color: textColor }} />
      <span className="text-sm font-medium" style={{ color: textColor }}>
        {message}
      </span>
    </div>
  );
};

const FormField = ({ label, icon: Icon, error, children, required }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.textMedium }}>
      {Icon && <Icon size={14} />}
      {label}
      {required && <span style={{ color: theme.danger }}>*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs" style={{ color: theme.danger }}>
        <AlertTriangle size={12} />
        {error}
      </p>
    )}
  </div>
);

const StockInfoPanel = ({ product, warehouse, stockData, products, warehouses }) => {
  const selectedProduct = products.find((p) => p.id === parseInt(product, 10));
  const selectedWarehouse = warehouses.find((w) => w.id === parseInt(warehouse, 10));

  const stockEntry = useMemo(() => {
    if (!product || !warehouse || !stockData.length) return null;
    return stockData.find(
      (s) => s.product_id === parseInt(product, 10) && s.warehouse_id === parseInt(warehouse, 10)
    );
  }, [product, warehouse, stockData]);

  if (!selectedProduct && !selectedWarehouse) return null;

  return (
    <div
      className="rounded-lg border p-4 mb-5"
      style={{ backgroundColor: theme.infoBg, borderColor: theme.infoBorder }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Info size={16} style={{ color: theme.textMedium }} />
        <span className="text-sm font-semibold" style={{ color: theme.textMedium }}>
          Current Stock Information
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs" style={{ color: theme.textLight }}>
            Warehouse
          </p>
          <p className="font-medium" style={{ color: theme.text }}>
            {selectedWarehouse?.name || '-'}
          </p>
          {selectedWarehouse?.code && (
            <p className="text-xs" style={{ color: theme.textLight }}>
              Code: {selectedWarehouse.code}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs" style={{ color: theme.textLight }}>
            Current Stock
          </p>
          <p className="font-medium" style={{ color: theme.text }}>
            {stockEntry ? stockEntry.on_hand ?? stockEntry.quantity ?? 0 : 0}
          </p>
          {stockEntry?.free_to_use !== undefined && (
            <p className="text-xs" style={{ color: theme.textLight }}>
              Free to use: {stockEntry.free_to_use}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ReceiptCreatePage = () => {
  const navigate = useNavigate();

  // Data State
  const [products, setProducts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI State
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product_id: '',
    supplier: '',
    quantity: '',
    to_warehouse_id: '',
    scheduled_date: '',
    user_id: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [prodData, whData, userData] = await Promise.all([
          productService.getData(),
          warehouseService.getAll(),
          userService.getAll(),
        ]);

        setProducts(prodData.products);
        setStockData(prodData.stock);
        setWarehouses(whData);
        setUsers(userData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setToast({ message: err.message || 'Failed to load form data', type: 'error' });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required';
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.to_warehouse_id) newErrors.to_warehouse_id = 'Warehouse is required';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Scheduled date is required';

    // NOTE: Removed stock insufficiency check because Receipts ADD stock, 
    // so current stock level shouldn't block the transaction.

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        product_id: parseInt(formData.product_id, 10),
        supplier: formData.supplier.trim(),
        quantity: parseFloat(formData.quantity),
        to_warehouse_id: parseInt(formData.to_warehouse_id, 10),
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
      };

      await productService.createReceipt(payload);

      setToast({ message: 'Receipt created successfully', type: 'success' });

      setTimeout(() => {
        // navigate('/receipts'); // Uncomment if route exists
        // Reset form for now
        setFormData({
            product_id: '',
            supplier: '',
            quantity: '',
            to_warehouse_id: '',
            scheduled_date: '',
            user_id: '',
        })
      }, 1500);
    } catch (err) {
      console.error('Submit error:', err);
      setToast({ message: err.message || 'Failed to create receipt', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/operations/receipts');
  };

  const isSubmitDisabled = submitting;
  const inputClasses = `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent`;

  if (loadingData) {
    return (
      <div className="w-full h-screen bg-[#FBF8F4] pt-16 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: theme.textMedium }} />
          <span style={{ color: theme.textMedium }}>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
              style={{ backgroundColor: theme.button }}
            >
              <ClipboardList size={20} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.text }}>
                Create Receipt
              </h1>
              <p className="text-sm" style={{ color: theme.textLight }}>
                Record incoming goods
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            {/* Stock Info Panel */}
            <StockInfoPanel
              product={formData.product_id}
              warehouse={formData.to_warehouse_id}
              stockData={stockData}
              products={products}
              warehouses={warehouses}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Product */}
              <FormField label="Product" icon={Package} error={errors.product_id} required>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  className={inputClasses}
                  style={{
                    borderColor: errors.product_id ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku || `ID: ${product.id}`})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Supplier */}
              <FormField label="Supplier" icon={Truck} error={errors.supplier} required>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  className={inputClasses}
                  style={{
                    borderColor: errors.supplier ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                />
              </FormField>

              {/* To Warehouse */}
              <FormField label="To Warehouse" icon={Warehouse} error={errors.to_warehouse_id} required>
                <select
                  name="to_warehouse_id"
                  value={formData.to_warehouse_id}
                  onChange={handleChange}
                  className={inputClasses}
                  style={{
                    borderColor: errors.to_warehouse_id ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.code ? `(${wh.code})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Quantity */}
              <FormField label="Quantity" error={errors.quantity} required>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter quantity"
                  className={inputClasses}
                  style={{
                    borderColor: errors.quantity ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                />
              </FormField>

              {/* Scheduled Date */}
              <FormField label="Scheduled Date" icon={Calendar} error={errors.scheduled_date} required>
                <input
                  type="datetime-local"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className={inputClasses}
                  style={{
                    borderColor: errors.scheduled_date ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                />
              </FormField>

              {/* Responsible User */}
              <FormField label="Responsible User" icon={User}>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  className={inputClasses}
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                >
                  <option value="">Select user (optional)</option>
                  {users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.name || user.email}
                        </option>
                      ))
                  ) : (
                      <option disabled>No users found</option>
                  )}
                </select>
              </FormField>
            </div>

            {/* Submit Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-lg border font-medium text-sm transition-colors hover:bg-gray-50"
                style={{ borderColor: theme.border, color: theme.textMedium }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3E2723]"
                style={{
                  backgroundColor: theme.button,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Create Receipt
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptCreatePage;