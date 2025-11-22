import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import DashboardPage from "./pages/Dashboard/DashboardPage";

import DeliveryListPage from "./pages/Delivery/DeliveryListPage";
import SingleDeliveryPage from "./pages/Delivery/SingleDeliveryPage";

import AdjustmentsListPage from "./pages/Adjustments/AdjustmentsListPage";
import SingleAdjustmentPage from "./pages/Adjustments/SingleAdjustmentPage";

import MoveHistoryPage from "./pages/MoveHistory/MoveHistoryPage";

import ReceiptsListPage from "./pages/Receipts/ReceiptsListPage";
import SingleReceiptPage from "./pages/Receipts/SingleReceiptPage";

import SettingsPage from "./pages/Settings/Settings";

import StockListPage from "./pages/Stock/StockListPage";
import StockOperationsPage from "./pages/Stock/StockOperationsPage";

import WarehouseListPage from "./pages/Warehouse/WarehouseListPage";
import WarehouseDetailsPage from "./pages/Warehouse/WarehouseDetailsPage";
import ReceiptsNew from "./pages/Receipts/ReceiptsNew";
import DeliveryNew from "./pages/Delivery/DeliveryNew";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="p-4">
        <Routes>

          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Receipts */}
          <Route path="/receipts" element={<ReceiptsListPage />} />
          <Route path="/receipts/:id" element={<SingleReceiptPage />} />
          <Route path="/receipts/new" element={<ReceiptsNew />} />
          

          {/* Deliveries */}
          <Route path="/deliveries" element={<DeliveryListPage />} />
          <Route path="/deliveries/:id" element={<SingleDeliveryPage />} />
          <Route path="/deliveries/new" element={<DeliveryNew />} />

          {/* Adjustments */}
          <Route path="/adjustments" element={<AdjustmentsListPage />} />
          <Route path="/adjustments/:id" element={<SingleAdjustmentPage />} />

          {/* Move History */}
          <Route path="/move-history" element={<MoveHistoryPage />} />

          {/* Stock */}
          <Route path="/stock" element={<StockListPage />} />
          <Route path="/stock/operations/:id" element={<StockOperationsPage />} />

          {/* Warehouses */}
          <Route path="/warehouses" element={<WarehouseListPage />} />
          <Route path="/warehouses/:id" element={<WarehouseDetailsPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
