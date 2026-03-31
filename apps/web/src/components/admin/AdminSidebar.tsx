'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { key: 'overview', href: '/admin', icon: LayoutDashboard },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'listings', href: '/admin/listings', icon: Package },
  { key: 'finance', href: '/admin/finance', icon: DollarSign },
  { key: 'disputes', href: '/admin/disputes', icon: AlertTriangle },
  { key: 'broadcasts', href: '/admin/broadcasts', icon: Megaphone },
];

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const { user } = useAuth();

  const basePath = pathname.replace(/^\/[a-z]{2}/, '');

  return (
    <aside
      className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = basePath === item.href || (item.href !== '/admin' && basePath.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
                title={collapsed ? t(`nav.${item.key}`) : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
        {!collapsed && (
          <div className="mt-2 px-3 py-2">
            <p className="text-xs text-gray-400">Admin</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {user?.displayName || user?.phone || 'Admin'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
