import type { User } from '@/types';

/**
 * Check if the current user can change another user's password
 * @param currentUser The user making the request
 * @param targetUser The user whose password would be changed
 * @returns true if the current user has permission to change the target user's password
 */
export function canChangePassword(currentUser: User, targetUser: User): boolean {
  // Cannot change own password through this interface
  if (currentUser.id === targetUser.id) {
    return false;
  }

  // Super admin can change password for admin and employee users (not other super_admins)
  if (currentUser.role === 'super_admin') {
    return targetUser.role !== 'super_admin';
  }

  // Admin can only change password for employees with overlapping company access
  if (currentUser.role === 'admin') {
    if (targetUser.role !== 'employee') {
      return false;
    }

    // Check company overlap
    const currentUserCompanies = new Set(currentUser.allowedCompanyIds || []);
    const targetUserCompanies = new Set(targetUser.allowedCompanyIds || []);

    // Check if there's any overlap
    for (const companyId of currentUserCompanies) {
      if (targetUserCompanies.has(companyId)) {
        return true;
      }
    }

    return false;
  }

  // Employees and other roles cannot change passwords
  return false;
}
