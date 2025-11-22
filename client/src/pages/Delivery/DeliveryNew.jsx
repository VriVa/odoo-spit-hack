import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Truck,
  Package,
  Warehouse,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';

// --- API SERVICE LAYER (Integrated) ---

// Change this to your actual FastAPI URL
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
      // Attempt to fetch users; fall back gracefully if endpoint doesn't exist
      const response = await api.get('/users/'); 
      return response.data;
    } catch (error) {
      console.warn("Could not fetch users (Endpoint might be missing or error occurred)");
      return []; 
    }
  },
};

const productService = {
  // The backend returns [products_list, stock_list]
  getData: async () => {
    try {
      const response = await api.get('/products/');
      return {
        products: response.data[0],
        stock: response.data[1]
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  // Backend expects Query Parameters for this specific endpoint
  createDelivery: async (data) => {
    try {
      const params = {
        product_id: data.product_id,
        quantity: data.quantity,
        from_warehouse_id: data.from_warehouse_id,
        scheduled_date: data.scheduled_date,
        user_id: data.user_id,
        delivery_address: data.delivery_address
      };

      // POST with null body, data in query params
      const response = await api.post('/products/create_delivery_order/', null, { params });
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
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? theme.successBg : theme.dangerBg;
  const textColor = type === 'success' ? theme.success : theme.danger;
  const Icon = type === 'success' ? Check : AlertTriangle;

  return (
    <div
      className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2"
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

const DeliveryCreatePage = () => {
  const navigate = useNavigate();

  // Data State
  const [products, setProducts] = useState([]);
  const [allStock, setAllStock] = useState([]); // Holds the raw stock list from backend
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI State
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    from_warehouse_id: '',
    scheduled_date: '',
    delivery_address: '',
    user_id: '',
  });

  const [errors, setErrors] = useState({});

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Parallel fetching using the integrated service layer
        const [productData, warehouseData, userData] = await Promise.all([
          productService.getData(),
          warehouseService.getAll(),
          userService.getAll()
        ]);

        // Map backend data to state
        setProducts(productData.products || []);
        setAllStock(productData.stock || []);
        setWarehouses(warehouseData || []);
        setUsers(userData || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        setToast({ message: err.message || 'Failed to load form data', type: 'error' });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Calculate Stock Availability dynamically
  // Logic: Filter allStock based on selected product AND selected warehouse
  const availableStock = useMemo(() => {
    if (!formData.product_id || !formData.from_warehouse_id) return null;

    const stockEntry = allStock.find(s => 
      s.product_id === parseInt(formData.product_id) && 
      s.warehouse_id === parseInt(formData.from_warehouse_id)
    );

    return stockEntry ? stockEntry.free_to_use : 0;
  }, [formData.product_id, formData.from_warehouse_id, allStock]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) newErrors.product_id = 'Product is required';
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.from_warehouse_id) newErrors.from_warehouse_id = 'Warehouse is required';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Scheduled date is required';

    // Stock validation
    if (availableStock !== null && formData.quantity) {
      if (parseFloat(formData.quantity) > availableStock) {
        newErrors.quantity = `Insufficient stock. Available: ${availableStock}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Prepare payload ensuring types match FastAPI expectations
      const payload = {
        product_id: parseInt(formData.product_id, 10),
        quantity: parseFloat(formData.quantity),
        from_warehouse_id: parseInt(formData.from_warehouse_id, 10),
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        delivery_address: formData.delivery_address || '',
        user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
      };

      await productService.createDelivery(payload);

      setToast({ message: 'Delivery Order Created Successfully', type: 'success' });

      setTimeout(() => {
        setFormData({
            product_id: '',
            quantity: '',
            from_warehouse_id: '',
            scheduled_date: '',
            delivery_address: '',
            user_id: '',
        })
      }, 1500);
    } catch (err) {
      console.error('Submit error:', err);
      setToast({ message: err.message || 'Failed to create delivery order', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isStockInsufficient =
    availableStock !== null &&
    formData.quantity &&
    parseFloat(formData.quantity) > availableStock;

  const isSubmitDisabled = submitting || isStockInsufficient;

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
            onClick={() => navigate(-1)}
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
              <Truck size={20} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.text }}>
                Create Delivery Order
              </h1>
              <p className="text-sm" style={{ color: theme.textLight }}>
                Fill in the details below
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* From Warehouse */}
              <FormField label="From Warehouse" icon={Warehouse} error={errors.from_warehouse_id} required>
                <select
                  name="from_warehouse_id"
                  value={formData.from_warehouse_id}
                  onChange={handleChange}
                  className={inputClasses}
                  style={{
                    borderColor: errors.from_warehouse_id ? theme.danger : theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </FormField>

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
                      [{product.sku}] {product.name}
                    </option>
                  ))}
                </select>
                
                {/* Stock Display Logic */}
                {!formData.from_warehouse_id && formData.product_id && (
                    <p className="text-xs mt-1" style={{ color: theme.textLight }}>
                        Select a warehouse to see availability.
                    </p>
                )}
                
                {availableStock !== null && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: isStockInsufficient ? theme.danger : theme.success }}
                  >
                    Available stock: {availableStock}
                  </p>
                )}
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
                    borderColor: errors.quantity || isStockInsufficient ? theme.danger : theme.border,
                    backgroundColor: isStockInsufficient ? theme.dangerBg : theme.inputBg,
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
                      <option disabled>No users found (API missing)</option>
                  )}
                </select>
              </FormField>

              {/* Delivery Address - Full Width */}
              <div className="md:col-span-2">
                <FormField label="Delivery Address" icon={MapPin}>
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter delivery address"
                    className={`${inputClasses} resize-none`}
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                    }}
                  />
                </FormField>
              </div>
            </div>

            {/* Stock Warning Banner */}
            {isStockInsufficient && (
              <div
                className="mt-5 flex items-center gap-3 p-3 rounded-lg border"
                style={{ backgroundColor: theme.dangerBg, borderColor: theme.danger }}
              >
                <AlertTriangle size={20} style={{ color: theme.danger }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.danger }}>
                    Insufficient Stock
                  </p>
                  <p className="text-xs" style={{ color: theme.danger }}>
                    Requested quantity ({formData.quantity}) exceeds available stock (
                    {availableStock}) in this warehouse.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                    Create Delivery Order
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

export default DeliveryCreatePage;