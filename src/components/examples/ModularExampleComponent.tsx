/**
 * Modular Example Component
 * Demonstrates the usage of all modular utilities
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Import all modular utilities
import {
    FieldValidators
} from '@/lib/modules/form-handling';

import {
    TableSortManager,
    PaginationHandler,
    SearchEngine
} from '@/lib/modules/table-utils';

import {
    DialogStateManager
} from '@/lib/modules/dialog-management';

import {
    ListDataTransformer
} from '@/lib/modules/data-transform';

import {
    useAsyncWithRetry,
    RetryConditions
} from '@/lib/modules/async-patterns';

// Example data types
interface ExampleUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    isActive: boolean;
}

interface ExampleFormData {
    name: string;
    email: string;
    role: string;
}

const sampleUsers: ExampleUser[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-15', isActive: true },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-02-20', isActive: true },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', createdAt: '2024-03-10', isActive: false },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'moderator', createdAt: '2024-01-25', isActive: true },
];

export function ModularExampleComponent() {
    const [users, setUsers] = useState<ExampleUser[]>(sampleUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<keyof ExampleUser>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [formData, setFormData] = useState<ExampleFormData>({ name: '', email: '', role: 'user' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 1. FORM HANDLING MODULE EXAMPLE
    // Using FieldValidators for form validation

    const validateForm = () => {
        const errors: Record<string, string> = {};

        // Validate name
        const nameResult = FieldValidators.validateField(formData.name, { required: true, minLength: 2 });
        if (!nameResult.isValid) {
            errors.name = nameResult.error || 'Name is invalid';
        }

        // Validate email
        const emailResult = FieldValidators.validateField(formData.email, FieldValidators.email);
        if (!emailResult.isValid) {
            errors.email = emailResult.error || 'Email is invalid';
        }

        // Validate role
        const roleResult = FieldValidators.validateField(formData.role, { required: true });
        if (!roleResult.isValid) {
            errors.role = roleResult.error || 'Role is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 2. TABLE UTILITIES MODULE EXAMPLE
    const searchEngine = useMemo(() => {
        return new SearchEngine(users, {
            fields: ['name', 'email', 'role'],
            caseSensitive: false,
            fuzzySearch: true,
            fuzzyThreshold: 0.6,
            highlightMatches: true
        });
    }, [users]);

    // TableSortManager is used inline in filteredAndSortedUsers for demonstration

    const filteredAndSortedUsers = useMemo(() => {
        let result = users;

        // Apply search
        if (searchTerm.trim()) {
            result = searchEngine.getFilteredItems(searchTerm);
        }

        // Apply sorting
        const sortedManager = new TableSortManager(result);
        sortedManager.setSingleSort(sortField, sortDirection);
        return sortedManager.getSortedData();
    }, [users, searchTerm, sortField, sortDirection, searchEngine]);

    const paginationHandler = useMemo(() => {
        return new PaginationHandler(filteredAndSortedUsers, {
            page: currentPage,
            pageSize: 5,
            totalItems: filteredAndSortedUsers.length
        });
    }, [filteredAndSortedUsers, currentPage]);

    const paginatedResult = paginationHandler.getPaginatedData();

    // 3. DATA TRANSFORMATION MODULE EXAMPLE
    const transformedUsers = useMemo(() => {
        const transformer = new ListDataTransformer<ExampleUser>({
            fields: ['name', 'email', 'role', 'isActive', 'createdAt'],
            formatters: {
                isActive: (value) => value ? 'Active' : 'Inactive',
                createdAt: (value) => new Date(value).toLocaleDateString()
            }
        });
        return transformer.transformItems(users);
    }, [users]);

    const userStats = useMemo(() => {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive).length;
        const adminUsers = users.filter(u => u.role === 'admin').length;

        return {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            admins: adminUsers,
            activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        };
    }, [users]);

    // 4. DIALOG MANAGEMENT MODULE EXAMPLE
    const [dialogManager] = useState(() => new DialogStateManager());

    const showConfirmDialog = (userId: string) => {
        const dialogConfig = DialogStateManager.createConfirmDialog(
            `delete-user-${userId}`,
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            () => {
                setUsers(prev => prev.filter(u => u.id !== userId));
                dialogManager.closeDialog(`delete-user-${userId}`);
            },
            () => dialogManager.closeDialog(`delete-user-${userId}`)
        );

        dialogManager.openDialog(dialogConfig);
    };

    // 5. ASYNC PATTERNS MODULE EXAMPLE
    const { execute: saveUser, loading: isSaving, error: saveError } = useAsyncWithRetry(
        async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (Math.random() < 0.3) {
                throw new Error('Network error occurred');
            }

            const newUser: ExampleUser = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                isActive: true
            };

            setUsers(prev => [...prev, newUser]);
            setFormData({ name: '', email: '', role: 'user' });
            setFormErrors({});
        },
        {
            maxRetries: 3,
            retryDelay: 1000,
            retryCondition: RetryConditions.networkErrors
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await saveUser();
    };

    const handleSort = (field: keyof ExampleUser) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Modular System Demo</h1>
                <p className="text-muted-foreground mt-2">
                    Demonstrating all modular utilities working together
                </p>
            </div>

            {/* Stats Cards - Data Transformation Example */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
                        <div className="text-xs text-muted-foreground">
                            {userStats.activePercentage.toFixed(1)}% of total
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Inactive Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{userStats.inactive}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{userStats.admins}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Example - Form Handling Module */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New User (Form Handling Module)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={formErrors.name ? 'border-red-500' : ''}
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={formErrors.email ? 'border-red-500' : ''}
                                />
                                {formErrors.email && (
                                    <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <Button type="submit" disabled={isSaving} className="w-full">
                                {isSaving ? 'Saving...' : 'Add User'}
                            </Button>

                            {saveError && (
                                <p className="text-sm text-red-500">Error: {saveError.message}</p>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table Example - Table Utilities Module */}
                <Card>
                    <CardHeader>
                        <CardTitle>User List (Table Utilities Module)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search */}
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {/* Table */}
                        <div className="border rounded-md">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th
                                            className="p-2 text-left cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('name')}
                                        >
                                            Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            className="p-2 text-left cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('role')}
                                        >
                                            Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-2 text-left">Status</th>
                                        <th className="p-2 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedResult.data.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-muted/30">
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <Badge variant="outline">{user.role}</Badge>
                                            </td>
                                            <td className="p-2">
                                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => showConfirmDialog(user.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {paginationHandler.getDisplayText()}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!paginatedResult.pagination.hasPreviousPage}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!paginatedResult.pagination.hasNextPage}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Module Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Modules Demonstrated</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-green-600">✅ Form Handling</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Field validation with FieldValidators utility
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-green-600">✅ Table Utilities</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                SearchEngine, TableSortManager, and PaginationHandler
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-green-600">✅ Data Transformation</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                ListDataTransformer for structured data processing
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-green-600">✅ Dialog Management</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                DialogStateManager for centralized dialog control
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-green-600">✅ Async Patterns</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                useAsyncWithRetry hook with retry conditions
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ModularExampleComponent;