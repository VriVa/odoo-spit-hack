// pages/Dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  PackageCheck, 
  Truck, 
  ArrowRightLeft,
  TrendingUp,
  PackagePlus,
  FileEdit,
  Search,
  Warehouse,
  RefreshCw
} from 'lucide-react';

import { useNavigate } from "react-router-dom";

// Import your mock API functions
import { 
  getProducts, 
  getStock, 
  getTransactionsByType, 
  getAllTransactions, 
  getWarehouses 
} from '../../services/api';

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, color = 'primary', onClick }) => {
  const colorClasses = {
    primary: 'bg-[#8D6E63] border-[#5D4037]',
    success: 'bg-[#8E8D4F] border-[#6B6A3A]',
    alert: 'bg-[#A0493B] border-[#7F3A2F]',
    warning: 'bg-[#C68642] border-[#A06934]',
  };

  return (
    <div 
      className={`bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm border border-[#D7CCC8] transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon size={20} className="text-white sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-[#5D4037] leading-tight">{title}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-[#3E2723] mb-1 sm:mb-2">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-[#8E8D4F] font-medium">
          <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

// Action Tile Component
const ActionTile = ({ icon: Icon, label, onClick }) => (
  <button 
    className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 lg:p-6 bg-[#FBF8F4] border-2 border-[#D7CCC8] rounded-lg hover:bg-[#F5F0EC] hover:border-[#5D4037] transition-all duration-200 active:scale-95"
    onClick={onClick}
  >
    <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-[#F5F0EC] rounded-xl flex items-center justify-center">
      <Icon size={24} className="text-[#5D4037] sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
    </div>
    <span className="text-xs sm:text-sm font-medium text-[#3E2723] text-center leading-tight">{label}</span>
  </button>
);

// Warehouse Card Component
const WarehouseCard = ({ name, totalStock, capacity }) => {
  const utilizationPercent = (totalStock / capacity) * 100;
  
  let utilizationColor = 'bg-[#8E8D4F]';
  if (utilizationPercent > 90) utilizationColor = 'bg-[#A0493B]';
  else if (utilizationPercent > 70) utilizationColor = 'bg-[#C68642]';

  return (
    <div className="p-4 sm:p-5 bg-[#FBF8F4] border border-[#D7CCC8] rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Warehouse size={18} className="text-[#5D4037] sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="text-sm sm:text-base font-semibold text-[#3E2723] truncate">{name}</span>
      </div>
      <div className="flex justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="text-xs text-[#8D6E63] mb-1">Stock</div>
          <div className="text-lg sm:text-xl font-semibold text-[#3E2723]">{totalStock.toLocaleString()}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-[#8D6E63] mb-1">Capacity</div>
          <div className="text-lg sm:text-xl font-semibold text-[#3E2723]">{capacity.toLocaleString()}</div>
        </div>
      </div>
      <div className="h-2 bg-[#D7CCC8] rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-300 ${utilizationColor}`}
          style={{ width: `${utilizationPercent}%` }}
        />
      </div>
      <span className="text-xs text-[#8D6E63]">{utilizationPercent.toFixed(1)}% utilized</span>
    </div>
  );
};

// Main Dashboard Page Component
const DashboardPage = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    productCount: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    pendingReceiptsCount: 0,
    pendingDeliveriesCount: 0,
    scheduledTransfersCount: 0,
    warehouses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const products = await getProducts();
      const stock = await getStock();
      const allTransactions = await getAllTransactions();
      const receipts = await getTransactionsByType('receipt');
      const deliveries = await getTransactionsByType('delivery');
      const warehouses = await getWarehouses();

      const productCount = products.length;
      const totalStockUnits = stock.reduce((sum, item) => sum + item.on_hand, 0);
      const lowStockCount = stock.filter(item => item.on_hand < 20).length;
      const pendingReceiptsCount = receipts.filter(r => r.status !== 'done').length;
      const pendingDeliveriesCount = deliveries.filter(d => d.status !== 'done').length;
      const scheduledTransfersCount = allTransactions.filter(
        t => t.type === 'transfer' && t.status === 'scheduled'
      ).length;

      const warehouseStats = warehouses.map(wh => {
        const warehouseStock = stock
          .filter(s => s.warehouse_id === wh.id)
          .reduce((sum, item) => sum + item.on_hand, 0);
        return {
          ...wh,
          totalStock: warehouseStock,
          capacity: wh.capacity || 10000,
        };
      });

      setDashboardData({
        productCount,
        totalStockUnits,
        lowStockCount,
        pendingReceiptsCount,
        pendingDeliveriesCount,
        scheduledTransfersCount,
        warehouses: warehouseStats,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#5D4037] animate-spin" />
          <div className="text-base sm:text-lg text-[#5D4037] font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FBF8F4] pt-16 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723]">Dashboard</h1>
            <p className="text-xs sm:text-sm text-[#8D6E63] mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button 
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors active:scale-95 self-start sm:self-auto"
            onClick={loadDashboardData}
          >
            <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Refresh</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
          <KPICard 
            title="Total Products"
            value={dashboardData.productCount}
            icon={Package}
            color="primary"
          />
          <KPICard 
            title="Total Stock Units"
            value={dashboardData.totalStockUnits.toLocaleString()}
            icon={Boxes}
            trend="+5.2%"
            color="success"
          />
          <KPICard 
            title="Low Stock Items"
            value={dashboardData.lowStockCount}
            icon={AlertTriangle}
            color="alert"
            onClick={() => navigate("/stock?filter=low")}
          />
          <KPICard 
            title="Pending Receipts"
            value={dashboardData.pendingReceiptsCount}
            icon={PackageCheck}
            color="warning"
            onClick={() => navigate("/receipts")}
          />
          <KPICard 
            title="Pending Deliveries"
            value={dashboardData.pendingDeliveriesCount}
            icon={Truck}
            color="warning"
            onClick={() => navigate("/deliveries")}
          />
          <KPICard 
            title="Internal Transfers"
            value={dashboardData.scheduledTransfersCount}
            icon={ArrowRightLeft}
            color="primary"
            onClick={() => navigate("/move-history")}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm border border-[#D7CCC8] mb-6">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-[#3E2723]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <ActionTile 
              icon={PackagePlus}
              label="New Receipt"
              onClick={() => navigate("/receipts/new")}
            />
            <ActionTile 
              icon={Truck}
              label="New Delivery"
              onClick={() => navigate("/deliveries/new")}
            />
            <ActionTile 
              icon={FileEdit}
              label="Adjust Stock"
              onClick={() => navigate("/adjustments")}
            />
            <ActionTile 
              icon={Search}
              label="Search Stock"
              onClick={() => navigate("/stock")}
            />
          </div>
        </div>

        {/* Warehouse Overview */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm border border-[#D7CCC8]">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-[#3E2723]">Warehouse Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {dashboardData.warehouses.map(warehouse => (
              <WarehouseCard 
                key={warehouse.id}
                name={warehouse.name}
                totalStock={warehouse.totalStock}
                capacity={warehouse.capacity}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
