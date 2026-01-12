/**
 * Sidebar Component
 * Mobile-first navigation sidebar with dark mode support
 */

'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Package,
  Users,
  FileText,
  Settings,
  Building2,
  ChevronDown,
  FileCheck,
  LayoutDashboard,
  Sparkles,
  UserCog,
  ShoppingCart,
  Wrench,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCompany } from '@/hooks/useCompany';
import { useCompanies } from '@/hooks/useCompanies';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/hooks/useAuth';
import { Company } from '@/types';
import { ROLES } from '@/lib/constants';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  excludeActivePaths?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/invoices/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/invoices/clients',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/invoices/products',
    icon: Package,
  },
  {
    title: 'Purchases',
    href: '/invoices/purchases',
    icon: ShoppingCart,
  },
  {
    title: 'Invoices',
    href: '/invoices/invoices',
    icon: FileText,
  },
  {
    title: 'Quotations',
    href: '/invoices/quotations',
    icon: FileCheck,
  },
  {
    title: 'Settings',
    href: '/invoices/settings',
    icon: Settings,
    excludeActivePaths: ['/invoices/settings/users'],
  },
];

// Admin-only navigation items
const adminNavItems: NavItem[] = [
  {
    title: 'Services',
    href: '/invoices/services',
    icon: Wrench,
  },
];

// Employee-only navigation items
const employeeNavItems: NavItem[] = [
  {
    title: 'Assigned Tasks',
    href: '/invoices/my-tasks',
    icon: ClipboardList,
  },
];

const superAdminNavItems: NavItem[] = [
  {
    title: 'User Management',
    href: '/invoices/settings/users',
    icon: UserCog,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, companiesLoading } = useAppData();
  const { user } = useAuth();


  return (
    <div className={cn(
      'flex h-full flex-col',
      'bg-sidebar border-r border-sidebar-border/50',
      'transition-colors duration-300',
      className
    )}>
      {/* Logo Section */}
      <div className="flex h-14 sm:h-16 items-center border-b border-sidebar-border/50 px-4 sm:px-6 bg-gradient-to-r from-primary/5 to-accent/5">
        <Link href="/" className="flex items-center gap-2 font-semibold group">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-accent shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
            InvoiceHub
          </span>
        </Link>
      </div>

      {/* Company Selector */}
      <div className="border-b border-sidebar-border/50 p-3 sm:p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-between h-auto py-2.5 px-3',
                'hover:shadow-md hover:border-primary/40 active:scale-[0.98]',
                'transition-all duration-200 border-sidebar-border/50',
                'dark:hover:bg-sidebar-accent'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="p-1 rounded bg-primary/10 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate font-medium text-sm">
                  {companiesLoading ? 'Loading...' : selectedCompany ? (selectedCompany.name || 'Unnamed Company') : 'No Company'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px] dark:bg-popover dark:border-border">
            <DropdownMenuLabel className="text-xs">Select Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {companies.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground text-sm">No companies found</span>
              </DropdownMenuItem>
            ) : (
              companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={cn(
                    'cursor-pointer text-sm',
                    selectedCompany?.id === company.id && 'bg-accent dark:bg-sidebar-accent'
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {company.name || 'Unnamed Company'}
                </DropdownMenuItem>
              ))
            )}
            {user?.role === 'super_admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/invoices/settings/company" className="flex w-full items-center cursor-pointer text-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Companies
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 sm:p-4 overflow-y-auto hide-scrollbar">
        {(() => {
          const isSuper = user?.role === ROLES.SUPER_ADMIN;
          // Show User Management to both super_admin and admin, but keep Settings rendered separately only for super_admin
          const showPrivilegedNav = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;
          const mainNav = navItems.filter((item) => {
            if (item.title === 'Settings' && isSuper) return false;
            if (user?.role === 'employee' && item.title === 'Settings') return false;
            return true;
          });

          return (
            <>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const matchesBasePath = pathname === item.href || pathname.startsWith(item.href + '/');
                const isExcluded = item.excludeActivePaths?.some((path) =>
                  pathname === path || pathname.startsWith(path + '/')
                );
                const isActive = matchesBasePath && !isExcluded;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 sm:py-3 text-sm font-medium',
                      'transition-all duration-200 group relative overflow-hidden',
                      'active:scale-[0.97]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:scale-[1.02] hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-200 relative z-10 shrink-0",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-semibold relative z-10 truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-white/30 backdrop-blur-sm px-2 py-0.5 text-xs text-white font-bold shadow-sm relative z-10 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Privileged Items (visible to Super Admins and Admins) */}
              {showPrivilegedNav && superAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 sm:py-3 text-sm font-medium',
                      'transition-all duration-200 group relative overflow-hidden',
                      'active:scale-[0.97]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:scale-[1.02] hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-200 relative z-10 shrink-0",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-semibold relative z-10 truncate">{item.title}</span>
                  </Link>
                );
              })}

              {/* Admin Navigation - Services (visible to Admin and Super Admin) */}
              {showPrivilegedNav && adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 sm:py-3 text-sm font-medium',
                      'transition-all duration-200 group relative overflow-hidden',
                      'active:scale-[0.97]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:scale-[1.02] hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-200 relative z-10 shrink-0",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-semibold relative z-10 truncate">{item.title}</span>
                  </Link>
                );
              })}

              {/* Employee Navigation - Assigned Tasks (visible only to Employees) */}
              {user?.role === ROLES.EMPLOYEE && employeeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 sm:py-3 text-sm font-medium',
                      'transition-all duration-200 group relative overflow-hidden',
                      'active:scale-[0.97]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:scale-[1.02] hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-200 relative z-10 shrink-0",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-semibold relative z-10 truncate">{item.title}</span>
                  </Link>
                );
              })}
              {isSuper && (() => {
                const settingsItem = navItems.find(i => i.title === 'Settings');
                if (!settingsItem) return null;
                const Icon = settingsItem.icon;
                const matchesBasePath = pathname === settingsItem.href || pathname.startsWith(settingsItem.href + '/');
                const isExcluded = settingsItem.excludeActivePaths?.some((path) =>
                  pathname === path || pathname.startsWith(path + '/')
                );
                const isActive = matchesBasePath && !isExcluded;

                return (
                  <Link
                    key={settingsItem.href}
                    href={settingsItem.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 sm:py-3 text-sm font-medium',
                      'transition-all duration-200 group relative overflow-hidden',
                      'active:scale-[0.97]',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent dark:hover:bg-sidebar-accent hover:scale-[1.02] hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-200 relative z-10 shrink-0",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-semibold relative z-10 truncate">{settingsItem.title}</span>
                  </Link>
                );
              })()}
            </>
          );
        })()}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-3 sm:p-4 mobile-safe-bottom">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3 text-xs border border-primary/20 dark:border-primary/30 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InvoiceHub Pro
            </p>
          </div>
          <p className="text-muted-foreground">v1.0.0 • GST Compliant</p>
        </div>
      </div>
    </div>
  );
}
