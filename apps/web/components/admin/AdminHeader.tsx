'use client';

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-[#111827] hover:bg-[#FAFAFA] rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#111827]">Admin User</p>
              <p className="text-xs text-gray-500">admin@maikanwa.com</p>
            </div>
            <div className="w-10 h-10 bg-[#1E2A78] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
