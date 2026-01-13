/**
 * React Query Keys
 * Centralized key management for cache invalidation and prefetching
 * Following best practices for type-safe query keys
 */

export const queryKeys = {
    // Companies
    companies: {
        all: ['companies'] as const,
        byId: (id: string) => ['companies', id] as const,
    },

    // Clients
    clients: {
        all: ['clients'] as const,
        byCompany: (companyId: string) => ['clients', 'company', companyId] as const,
        byId: (id: string) => ['clients', id] as const,
    },

    // Products
    products: {
        all: ['products'] as const,
        byCompany: (companyId: string) => ['products', 'company', companyId] as const,
        byId: (id: string) => ['products', id] as const,
    },

    // Invoices
    invoices: {
        all: ['invoices'] as const,
        byCompany: (companyId: string) => ['invoices', 'company', companyId] as const,
        byId: (id: string) => ['invoices', id] as const,
    },

    // Services
    services: {
        all: ['services'] as const,
        byCompany: (companyId: string) => ['services', 'company', companyId] as const,
        myTasks: (companyId: string, userId: string) => ['services', 'my-tasks', companyId, userId] as const,
        byId: (id: string) => ['services', id] as const,
    },

    // Analytics
    analytics: {
        dashboard: (companyId: string, timeFilter: string) => ['analytics', 'dashboard', companyId, timeFilter] as const,
        employeePerformance: (companyId: string, userId?: string) => ['analytics', 'employee', companyId, userId || 'self'] as const,
    },

    // Users
    users: {
        all: ['users'] as const,
        byCompany: (companyId: string) => ['users', 'company', companyId] as const,
        byId: (id: string) => ['users', id] as const,
    },
} as const;
