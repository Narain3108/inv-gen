/**
 * FeaturesSection Component
 * Features grid for the landing page
 */

'use client';

import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, Users, Package, Download, Globe, Zap } from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'GST-Compliant Invoices',
        description: 'Automatically calculate CGST, SGST, and IGST based on state codes. Fully compliant with Indian GST regulations.',
    },
    {
        icon: Building2,
        title: 'Multiple Companies',
        description: 'Manage invoices for multiple companies from one account. Perfect for consultants and agencies.',
    },
    {
        icon: Users,
        title: 'Client Management',
        description: 'Store client details with GSTIN verification. Quick access to billing information.',
    },
    {
        icon: Package,
        title: 'Product Catalog',
        description: 'Create a product/service catalog with HSN codes and GST rates. Add items to invoices with one click.',
    },
    {
        icon: Download,
        title: 'Instant PDF Generation',
        description: 'Generate professional PDF invoices instantly. Preview before downloading.',
    },
    {
        icon: Globe,
        title: 'Cloud-Based',
        description: 'Access your invoices from anywhere. Data synced across all devices in real-time.',
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-28">
            <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-primary">Powerful Features</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">Everything You Need</h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                    Powerful features to streamline your invoicing workflow
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {features.map((feature) => (
                    <Card
                        key={feature.title}
                        className="group border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover-lift hover:shadow-xl dark:hover:shadow-primary/20"
                    >
                        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 w-fit group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            </div>
                            <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                            <CardDescription className="text-sm sm:text-base leading-relaxed">
                                {feature.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export default FeaturesSection;
