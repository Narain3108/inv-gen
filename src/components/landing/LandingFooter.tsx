/**
 * LandingFooter Component
 * Footer for the landing page
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export function LandingFooter() {
    return (
        <footer className="border-t border-primary/10 dark:border-primary/20 mt-12 sm:mt-16 md:mt-20">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
                    {/* Brand */}
                    <div className="space-y-3 sm:space-y-4">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-primary to-accent shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                InvoiceHub
                            </span>
                        </Link>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Professional invoice generator for businesses of all sizes.
                            Create GST-compliant invoices in seconds.
                        </p>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="font-bold mb-3 sm:mb-4 text-foreground text-sm sm:text-base">Features</h4>
                        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                            <li className="hover:text-primary transition-colors cursor-pointer">GST Invoices</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Client Management</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Product Catalog</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">PDF Export</li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-3 sm:mb-4 text-foreground text-sm sm:text-base">Quick Links</h4>
                        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <li>
                                <Link href="/invoices/invoices" className="text-muted-foreground hover:text-primary transition-colors">
                                    Generate Invoice
                                </Link>
                            </li>
                            <li>
                                <Link href="/invoices/clients" className="text-muted-foreground hover:text-primary transition-colors">
                                    Manage Clients
                                </Link>
                            </li>
                            <li>
                                <Link href="/invoices/products" className="text-muted-foreground hover:text-primary transition-colors">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/invoices/settings" className="text-muted-foreground hover:text-primary transition-colors">
                                    Settings
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold mb-3 sm:mb-4 text-foreground text-sm sm:text-base">Support</h4>
                        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                            <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-primary/10 dark:border-primary/20 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()} InvoiceHub. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
                        <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
                        <span className="hover:text-primary transition-colors cursor-pointer">Cookies</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default LandingFooter;
