/**
 * Sidebar Component
 * Main navigation sidebar with company selector
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Package,
  Users,
  FileText,
  Settings,
  Building2,
  ChevronDown,
  FileCheck,
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
import { Company } from '@/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
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
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, loading, loadCompanies } = useCompanies();

  // Load companies from Firestore on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    // If no company is selected and we have companies, select the first one
    if (!selectedCompany && companies.length > 0) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, setSelectedCompany]);

  return (
    <div className={cn('flex h-full flex-col border-r bg-gradient-to-b from-sidebar to-sidebar/80 backdrop-blur-xl', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border/50 px-6 bg-gradient-to-r from-primary/5 to-accent/5">
        <Link href="/" className="flex items-center gap-2 font-semibold group">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-accent shadow-lg group-hover:scale-110 transition-transform duration-200">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">InvoiceHub</span>
        </Link>
      </div>

      {/* Company Selector */}
      <div className="border-b border-sidebar-border/50 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between hover:shadow-md transition-all duration-200 border-primary/20 hover:border-primary/40">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate font-medium">
                  {loading ? 'Loading...' : selectedCompany ? selectedCompany.name : 'No Company'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            <DropdownMenuLabel>Select Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {companies.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">No companies found</span>
              </DropdownMenuItem>
            ) : (
              companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={cn(
                    'cursor-pointer',
                    selectedCompany?.id === company.id && 'bg-accent'
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {company.name}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/invoices/settings/company" className="flex w-full items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Manage Companies
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:scale-[1.01] hover:shadow-sm'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors relative z-10",
                isActive ? "bg-white/25 backdrop-blur-sm" : "bg-primary/10 group-hover:bg-primary/20"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold relative z-10">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-white/30 backdrop-blur-sm px-2 py-0.5 text-xs text-white font-bold shadow-sm relative z-10">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3 text-xs text-sidebar-foreground border border-primary/20 shadow-sm">
          <p className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">GST Invoice System</p>
          <p className="mt-1 text-muted-foreground">v1.0.0 • Professional</p>
        </div>
      </div>
    </div>
  );
}
