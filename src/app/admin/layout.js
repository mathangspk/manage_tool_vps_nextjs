'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, X, LogOut, User as UserIcon, Shield,
  ClipboardList, Wrench, AlertTriangle, RefreshCw, 
  FileText, ShieldAlert, BarChart3, Users
} from 'lucide-react';

const MENU_ITEMS = [
  {
    path: '/admin/order',
    name: 'Quản lý Work Order',
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    path: '/admin/tool',
    name: 'Quản lý dụng cụ',
    icon: Wrench,
    adminOnly: false,
  },
  {
    path: '/admin/fastReport',
    name: 'Báo cáo nhanh',
    icon: AlertTriangle,
    adminOnly: false,
  },
  {
    path: '/admin/cchtt',
    name: 'Thay đổi CHTT',
    icon: RefreshCw,
    adminOnly: false,
  },
  {
    path: '/admin/cgsat',
    name: 'Thay đổi GSAT',
    icon: RefreshCw,
    adminOnly: false,
  },
  {
    path: '/admin/bbdgkt',
    name: 'Biên bản ĐGKT',
    icon: FileText,
    adminOnly: false,
  },
  {
    path: '/admin/bptc',
    name: 'BPTC & JSA',
    icon: ShieldAlert,
    adminOnly: false,
  },
  {
    path: '/admin/thongke',
    name: 'Dashboard Thống kê',
    icon: BarChart3,
    adminOnly: false,
  },
  {
    path: '/admin/customer',
    name: 'Quản lý người dùng',
    icon: Users,
    adminOnly: true,
  },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Get current page name
  const currentMenuItem = MENU_ITEMS.find(item => pathname.startsWith(item.path));
  const pageTitle = currentMenuItem ? currentMenuItem.name : 'Hệ thống Quản lý';

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly && !user.admin) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 transform lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20">
          <Link href="/admin/order" className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-white tracking-wide text-sm">PVPS MAINTENANCE</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'}
                `}
              >
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-9 w-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.department || 'Bộ phận kỹ thuật'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all uppercase tracking-wider"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {user.admin ? 'Quản trị viên' : 'Kỹ sư vận hành'}
            </span>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-medium text-slate-500">Xin chào</p>
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}
