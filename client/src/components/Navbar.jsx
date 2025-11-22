import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PackageCheck, 
  Truck, 
  FileEdit, 
  History, 
  Package, 
  Warehouse, 
  Settings, 
  Bell, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

import { SignedIn, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router-dom";  // <-- ADD THIS

const Navbar = ({ currentRoute, userName = "User", notifications = 0 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();

  const navLinks = [
    { icon: LayoutDashboard, to: '/', label: 'Dashboard' },
    { icon: PackageCheck, to: '/receipts', label: 'Receipts' },
    { icon: Truck, to: '/deliveries', label: 'Deliveries' },
    { icon: FileEdit, to: '/adjustments', label: 'Adjustments' },
    { icon: History, to: '/move-history', label: 'Move History' },
    { icon: Package, to: '/stock', label: 'Stock' },
    { icon: Warehouse, to: '/warehouses', label: 'Warehouses' },
    { icon: Settings, to: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#3E2723] to-[#5D4037] shadow-md z-50">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Package size={24} className="text-[#F5F0EC] sm:w-7 sm:h-7" strokeWidth={2.5} />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F5F0EC] tracking-tight">
              StockMaster
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-1 flex-1 justify-center max-w-4xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentRoute === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}    // <-- FIXED
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 border-b-2 whitespace-nowrap
                    ${isActive 
                      ? 'text-[#F5F0EC] bg-white/10 border-[#8E8D4F]' 
                      : 'text-[#F5F0EC]/70 hover:text-[#F5F0EC] hover:bg-white/5 border-transparent'
                    }`}
                >
                  <Icon size={16} />
                  <span className="text-xs lg:text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            <button className="relative p-2 text-[#F5F0EC] hover:bg-white/10 rounded-lg transition-colors">
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#A0493B] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {notifications}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 px-2 sm:px-3 py-2 text-[#F5F0EC] hover:bg-white/10 rounded-lg">
              <User size={18} />
              <span className="text-xs sm:text-sm font-medium hidden md:block">{userName}</span>
            </div>

            {/* Logout button */}
            <SignedIn>
              <button
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="bg-[#A0493B] hover:bg-[#8d3f33] text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </SignedIn>

            <button 
              className="xl:hidden p-2 text-[#F5F0EC] hover:bg-white/10 rounded-lg ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden absolute top-16 left-0 right-0 bg-[#3E2723] shadow-lg">
          <div className="p-3 sm:p-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentRoute === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}   // <-- FIXED
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm sm:text-base font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'text-[#F5F0EC] bg-white/10' 
                      : 'text-[#F5F0EC]/70 hover:text-[#F5F0EC] hover:bg-white/5'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Logout bottom (mobile) */}
            <SignedIn>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ redirectUrl: "/sign-in" });
                }}
                className="bg-[#A0493B] hover:bg-[#8d3f33] text-white px-4 py-3 rounded-lg text-base mt-3"
              >
                Logout
              </button>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
