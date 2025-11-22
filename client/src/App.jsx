import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";

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
// Layout wrapper (hide navbar on login/signup)
function Layout({ children }) {
  const location = useLocation();
  const hideNavbar =
  location.pathname === "/" || 
  location.pathname.startsWith("/sign-in");


  return (
    <>
      {!hideNavbar && <Navbar />}
      <div>{children}</div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>

          {/* AUTH ROUTES (public) */}
          <Route path="/sign-in" element={<LoginPage />} />
          <Route path="/" element={<SignupPage />} />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* RECEIPTS */}
          <Route
            path="/receipts"
            element={
              <ProtectedRoute>
                <ReceiptsListPage />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts/:id"
            element={
              <ProtectedRoute>
                <SingleReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts/new"
            element={
              <ProtectedRoute>
                <ReceiptsNew />
              </ProtectedRoute>
            }
          />
          {/* DELIVERIES */}
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute>
                <DeliveryListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries/new"
            element={
              <ProtectedRoute>
                <DeliveryNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries/:id"
            element={
              <ProtectedRoute>
                <SingleDeliveryPage />
              </ProtectedRoute>
            }
          />

          {/* ADJUSTMENTS */}
          <Route
            path="/adjustments"
            element={
              <ProtectedRoute>
                <AdjustmentsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adjustments/:id"
            element={
              <ProtectedRoute>
                <SingleAdjustmentPage />
              </ProtectedRoute>
            }
          />

          {/* MOVE HISTORY */}
          <Route
            path="/move-history"
            element={
              <ProtectedRoute>
                <MoveHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* STOCK */}
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <StockListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/operations/:id"
            element={
              <ProtectedRoute>
                <StockOperationsPage />
              </ProtectedRoute>
            }
          />

          {/* WAREHOUSES */}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute>
                <WarehouseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouses/:id"
            element={
              <ProtectedRoute>
                <WarehouseDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
