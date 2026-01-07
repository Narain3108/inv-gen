/**
 * LandingNavbar Component
 * Navigation header for the landing page
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, Menu, X, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface LandingNavbarProps {
    scrolled: boolean;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
}

export function LandingNavbar({ scrolled, isMenuOpen, onToggleMenu }: LandingNavbarProps) {
    const router = useRouter();

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-background/80 dark:bg-background/90 backdrop-blur-xl shadow-lg border-b border-primary/10 dark:border-primary/20'
                : 'bg-transparent'
            }`}>
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-primary to-accent shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            InvoiceHub
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                            How It Works
                        </Link>
                        <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                            Testimonials
                        </Link>
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/auth/login')}
                            className="font-medium hover:text-primary"
                        >
                            Log in
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/register')}
                            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex md:hidden items-center gap-2">
                        <ThemeToggle />
                        <button
                            className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                            onClick={onToggleMenu}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 dark:bg-background/98 backdrop-blur-xl border-b border-primary/10 dark:border-primary/20 shadow-xl animate-in slide-in-from-top-5">
                        <div className="container mx-auto px-4 py-6 space-y-4">
                            <Link
                                href="#features"
                                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={onToggleMenu}
                            >
                                Features
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={onToggleMenu}
                            >
                                How It Works
                            </Link>
                            <Link
                                href="#testimonials"
                                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={onToggleMenu}
                            >
                                Testimonials
                            </Link>
                            <Button
                                onClick={() => router.push('/auth/register')}
                                className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 font-semibold"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default LandingNavbar;
