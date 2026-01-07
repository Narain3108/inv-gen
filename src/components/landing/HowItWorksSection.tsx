/**
 * HowItWorksSection Component
 * Step-by-step guide for the landing page
 */

'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const steps = [
    {
        number: 1,
        title: 'Setup Company',
        description: 'Add your company details with GSTIN, address, and bank information',
    },
    {
        number: 2,
        title: 'Add Clients & Products',
        description: 'Create your client database and product catalog for quick invoicing',
    },
    {
        number: 3,
        title: 'Generate Invoice',
        description: 'Create professional invoices and download as PDF instantly',
    },
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="relative py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background dark:from-primary/10 dark:via-accent/10 dark:to-background rounded-3xl" />

            <div className="container mx-auto px-4 sm:px-6 relative">
                <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium text-primary">Simple Process</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">How It Works</h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                        Start generating invoices in 3 simple steps
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative group">
                            <div className="text-center p-6 sm:p-8 rounded-2xl border-2 border-primary/10 dark:border-primary/20 bg-background/50 dark:bg-background/80 backdrop-blur-sm hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover-lift hover:shadow-xl dark:hover:shadow-primary/20">
                                <div className="relative mb-4 sm:mb-6">
                                    <div className="bg-gradient-to-r from-primary to-accent text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto shadow-lg shadow-primary/30 dark:shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                                        {step.number}
                                    </div>
                                    {/* Connecting Line - Desktop Only */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent dark:from-primary/30 dark:to-transparent -translate-y-1/2" />
                                    )}
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{step.title}</h3>
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
