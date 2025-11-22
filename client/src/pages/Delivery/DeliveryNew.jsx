import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
      className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2"
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

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [stockInfo, setStockInfo] = useState({ available: null, checking: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [productsRes, warehousesRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products/`),
          fetch(`${API_BASE_URL}/warehouses/`),
          fetch(`${API_BASE_URL}/users/`),
        ]);

        if (!productsRes.ok || !warehousesRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch form data');
        }

        const [productsData, warehousesData, usersData] = await Promise.all([
          productsRes.json(),
          warehousesRes.json(),
          usersRes.json(),
        ]);

        setProducts(productsData);
        setWarehouses(warehousesData);
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setToast({ message: 'Failed to load form data', type: 'error' });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const checkStock = useCallback(async (productId) => {
    if (!productId) {
      setStockInfo({ available: null, checking: false });
      return;
    }

    try {
      setStockInfo((prev) => ({ ...prev, checking: true }));
      const res = await fetch(`${API_BASE_URL}/products/${productId}/stock`);
      if (res.ok) {
        const data = await res.json();
        setStockInfo({ available: data.quantity ?? data.stock ?? data, checking: false });
      } else {
        setStockInfo({ available: null, checking: false });
      }
    } catch (err) {
      console.error('Error checking stock:', err);
      setStockInfo({ available: null, checking: false });
    }
  }, []);

  useEffect(() => {
    if (formData.product_id) {
      checkStock(formData.product_id);
    }
  }, [formData.product_id, checkStock]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.from_warehouse_id) {
      newErrors.from_warehouse_id = 'Warehouse is required';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required';
    }

    if (
      stockInfo.available !== null &&
      formData.quantity &&
      parseFloat(formData.quantity) > stockInfo.available
    ) {
      newErrors.quantity = `Insufficient stock. Available: ${stockInfo.available}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const scheduledDateTime = new Date(formData.scheduled_date).toISOString();

      const payload = {
        product_id: parseInt(formData.product_id, 10),
        quantity: parseFloat(formData.quantity),
        from_warehouse_id: parseInt(formData.from_warehouse_id, 10),
        scheduled_date: scheduledDateTime,
        delivery_address: formData.delivery_address || null,
        user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
      };

      const res = await fetch(`${API_BASE_URL}/products/create_delivery_order/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to create delivery order');
      }

      setToast({ message: 'Delivery Order Created Successfully', type: 'success' });

      setTimeout(() => {
        navigate('/deliveries');
      }, 1500);
    } catch (err) {
      console.error('Submit error:', err);
      setToast({ message: err.message || 'Failed to create delivery order', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/deliveries');
  };

  const isStockInsufficient =
    stockInfo.available !== null &&
    formData.quantity &&
    parseFloat(formData.quantity) > stockInfo.available;

  const isSubmitDisabled = submitting || isStockInsufficient || stockInfo.checking;

  const inputClasses = `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50`;

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: theme.textMedium }} />
          <span style={{ color: theme.textMedium }}>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: theme.bg }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
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
                {stockInfo.checking && (
                  <p className="text-xs flex items-center gap-1" style={{ color: theme.textLight }}>
                    <Loader2 size={12} className="animate-spin" /> Checking stock...
                  </p>
                )}
                {stockInfo.available !== null && !stockInfo.checking && (
                  <p
                    className="text-xs"
                    style={{ color: isStockInsufficient ? theme.danger : theme.success }}
                  >
                    Available stock: {stockInfo.available}
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
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name}
                    </option>
                  ))}
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
                    {stockInfo.available}). Please reduce the quantity.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSubmitDisabled ? theme.textLight : theme.button,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitDisabled) e.currentTarget.style.backgroundColor = theme.buttonHover;
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitDisabled) e.currentTarget.style.backgroundColor = theme.button;
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