/**
 * User Profile Page
 * Displays user information, role, and assigned companies
 * SOLID Principles Applied:
 * - Single Responsibility: Each component handles one concern
 * - Open/Closed: Extensible for additional profile sections
 * - DRY: Reusable InfoRow component
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Building2, Mail, User as UserIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Company } from '@/types';

/**
 * InfoRow Component - Reusable row for displaying profile information
 * Follows DRY principle by avoiding repetitive markup
 */
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start gap-3 py-3', className)}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="text-base font-medium mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

/**
 * Profile Page Component
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { companies } = useAppData();

  const handleClose = () => {
    router.back();
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      super_admin: { label: 'Super Admin', variant: 'default' },
      admin: { label: 'Admin', variant: 'secondary' },
      employee: { label: 'Employee', variant: 'outline' },
    };
    return roleMap[role] || { label: role, variant: 'outline' };
  };

  const getAssignedCompanies = () => {
    if (!user) return [];
    
    // Super admin has access to all companies
    if (user.role === 'super_admin') {
      return companies;
    }
    
    // Filter companies based on allowedCompanyIds
    return companies.filter((company: Company) => 
      user.allowedCompanyIds?.includes(company.id)
    );
  };

  const roleInfo = user ? getRoleDisplay(user.role) : null;
  const assignedCompanies = getAssignedCompanies();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Profile</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Close profile"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* User Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl sm:text-3xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{user.name}</h2>
                {roleInfo && (
                  <Badge variant={roleInfo.variant} className="mt-2">
                    {roleInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-1">
              <InfoRow
                icon={<UserIcon className="h-5 w-5" />}
                label="Username"
                value={user.username || user.email.split('@')[0]}
              />
              <Separator />
              <InfoRow
                icon={<Mail className="h-5 w-5" />}
                label="Email"
                value={user.email}
              />
              <Separator />
              <InfoRow
                icon={<Shield className="h-5 w-5" />}
                label="Role"
                value={roleInfo?.label || user.role}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assigned Companies Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assigned Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.role === 'super_admin' ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">All Companies Access</span>
              </div>
            ) : assignedCompanies.length > 0 ? (
              <div className="grid gap-3">
                {assignedCompanies.map((company: Company) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{company.name}</p>
                      {company.gstin && (
                        <p className="text-sm text-muted-foreground truncate">
                          GSTIN: {company.gstin}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No companies assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
