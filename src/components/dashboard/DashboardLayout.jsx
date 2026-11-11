import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({
  role = 'member', // 'member' | 'branch_manager' | 'super_admin'
  user = {},
  activeTab = 'overview',
  onTabChange,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex font-sans antialiased selection:bg-[#2dd4bf] selection:text-slate-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        role={role}
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <DashboardHeader
          role={role}
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dashboard Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

