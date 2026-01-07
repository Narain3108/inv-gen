/**
 * TotalsSummary Component
 * Displays invoice/quotation/purchase totals with tax breakdown
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface TaxBreakdownItem {
    rate: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
}

interface TotalsSummaryProps {
    subtotal?: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess?: number;
    totalAmount: number;
    taxBreakdown?: TaxBreakdownItem[];
    isInterState?: boolean;
    showTaxBreakdown?: boolean;
    className?: string;
}

export function TotalsSummary({
    subtotal,
    taxableAmount,
    cgst,
    sgst,
    igst,
    cess = 0,
    totalAmount,
    taxBreakdown = [],
    isInterState = false,
    showTaxBreakdown = true,
    className = '',
}: TotalsSummaryProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);

    return (
        <Card className={`border-primary/20 shadow-sm ${className}`}>
            <CardHeader className="pb-2 pt-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-3 space-y-2">
                {/* Subtotal (if different from taxable amount) */}
                {subtotal !== undefined && subtotal !== taxableAmount && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                )}

                {/* Taxable Amount */}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Amount</span>
                    <span>{formatCurrency(taxableAmount)}</span>
                </div>

                {/* Tax Breakdown Toggle */}
                {showTaxBreakdown && taxBreakdown.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-xs h-7"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                    >
                        <span>Tax Breakdown by Rate</span>
                        {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                )}

                {/* Tax Breakdown Details */}
                {showBreakdown && taxBreakdown.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded-md space-y-2 text-xs">
                        {taxBreakdown.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="font-medium text-primary">GST @ {item.rate}%</div>
                                <div className="flex justify-between pl-2">
                                    <span className="text-muted-foreground">Taxable</span>
                                    <span>{formatCurrency(item.taxableAmount)}</span>
                                </div>
                                {!isInterState ? (
                                    <>
                                        <div className="flex justify-between pl-2">
                                            <span className="text-muted-foreground">CGST ({item.rate / 2}%)</span>
                                            <span>{formatCurrency(item.cgst)}</span>
                                        </div>
                                        <div className="flex justify-between pl-2">
                                            <span className="text-muted-foreground">SGST ({item.rate / 2}%)</span>
                                            <span>{formatCurrency(item.sgst)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between pl-2">
                                        <span className="text-muted-foreground">IGST ({item.rate}%)</span>
                                        <span>{formatCurrency(item.igst)}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Tax Summary */}
                {!isInterState ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">CGST</span>
                            <span>{formatCurrency(cgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">SGST</span>
                            <span>{formatCurrency(sgst)}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IGST</span>
                        <span>{formatCurrency(igst)}</span>
                    </div>
                )}

                {/* Cess (if applicable) */}
                {cess > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cess</span>
                        <span>{formatCurrency(cess)}</span>
                    </div>
                )}

                {/* Grand Total */}
                <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total</span>
                        <span className="text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default TotalsSummary;
