/**
 * CTASection Component
 * Call-to-action section for the landing page
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Globe, ArrowRight } from 'lucide-react';

export function CTASection() {
    const router = useRouter();

    return (
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-28">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
                {/* Background with Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer" />

                {/* Content */}
                <div className="relative p-8 sm:p-12 md:p-16 text-center text-white">
                    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight px-4">
                            Ready to Streamline Your Invoicing?
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl opacity-95 leading-relaxed px-4">
                            Join thousands of businesses generating professional GST invoices every day.
                            No credit card required. Start for free in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-xl font-semibold text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 group"
                                onClick={() => router.push('/auth/register')}
                            >
                                Get Started Now - It's Free
                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-2 border-white/20 text-white bg-transparent hover:bg-white/5 hover:border-white/30 transition-all duration-200 font-semibold text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-sm"
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Learn More
                            </Button>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                <span>Secure & Private</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                <span>Lightning Fast</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                <span>Cloud Synced</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTASection;
