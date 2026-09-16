import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Menu,
  X,
  ChevronRight,
  Search,
  Bell,
  User,
} from 'lucide-react';
import { mockUsage } from '../data/mockData';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard' },
  { icon: Settings, label: 'Settings', path: '/dashboard' },
];

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-[68px]'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-neutral-100">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold text-navy-900 text-sm whitespace-nowrap overflow-hidden"
                >
                  AI Reviewer
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path && item.label === currentPage;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-neutral-100">
          {sidebarOpen ? (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-500">Free Plan</span>
                <span className="text-xs text-neutral-400">{mockUsage.documentsProcessed}/{mockUsage.dailyLimit} today</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${(mockUsage.documentsProcessed / mockUsage.dailyLimit) * 100}%` }}
                />
              </div>
              <button className="mt-3 w-full py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                Upgrade Plan
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-16 px-4 lg:px-6 bg-white border-b border-neutral-200 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden mr-3 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>

          <h1 className="text-sm font-semibold text-navy-900">{currentPage}</h1>

          <div className="ml-auto flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search documents...</span>
            </button>
            
            <Link
              to="/upload"
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>

            <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-neutral-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
            </button>

            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center ml-1">
              <span className="text-xs font-semibold text-navy-700">AC</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
