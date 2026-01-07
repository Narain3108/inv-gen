/**
 * HeroSection Component
 * Hero section for the landing page
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
    const router = useRouter();

    return (
        <section className="relative pt-20 sm:pt-24 md:pt-32 lg:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-32 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 dark:bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative">
                <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30 shadow-lg">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Professional Invoice Management
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-4">
                        Create Stunning Invoices in{' '}
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                            Seconds
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                        Streamline your billing process with our intuitive invoice generator.
                        Create, manage, and send professional invoices that get you paid faster.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
                        <Button
                            size="lg"
                            onClick={() => router.push('/auth/register')}
                            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/30 dark:shadow-primary/20 hover:shadow-2xl hover:scale-105 transition-all duration-200 font-semibold text-base px-6 sm:px-8 py-5 sm:py-6 group"
                        >
                            Start Creating Now
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground px-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span>No Credit Card</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span>Free Forever</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span>Instant Setup</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 pt-8 sm:pt-12 px-4">
                        {[
                            { value: '100%', label: 'GST Compliant' },
                            { value: 'Free', label: 'Forever' },
                            { value: 'Instant', label: 'PDF Download' },
                            { value: 'Cloud', label: 'Storage' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all hover-lift"
                            >
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1 sm:mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
