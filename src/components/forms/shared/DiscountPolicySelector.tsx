'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Percent, Info, Lock } from 'lucide-react';
import { useDiscountPoliciesQuery } from '@/hooks/queries';
import { formatCurrency } from '@/utils/formatters';
import type { DiscountPolicy } from '@/lib/api/discounts.api';

interface DiscountPolicySelectorProps {
    itemPrice: number;
    itemQuantity: number;
    currentDiscountAmount: number; // This is the total absolute discount applied
    onApply: (calculatedDiscount: number) => void;
}

export function DiscountPolicySelector({
    itemPrice,
    itemQuantity,
    currentDiscountAmount,
    onApply
}: DiscountPolicySelectorProps) {
    const { policies, isLoading } = useDiscountPoliciesQuery();
    const [open, setOpen] = useState(false);
    const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
    
    const baseTotal = itemPrice * itemQuantity;

    // Check if a policy is applicable based on item constraints
    const isPolicyApplicable = (policy: DiscountPolicy) => {
        if (policy.condition_type === 'none') return true;
        if (policy.condition_type === 'min_qty' && policy.condition_value) {
            return itemQuantity >= policy.condition_value;
        }
        if (policy.condition_type === 'min_amount' && policy.condition_value) {
            return baseTotal >= policy.condition_value;
        }
        return true;
    };

    const applicablePolicies = useMemo(() => {
        return policies.filter(isPolicyApplicable);
    }, [policies, itemPrice, itemQuantity]);

    const nonApplicablePolicies = useMemo(() => {
        return policies.filter(p => !isPolicyApplicable(p));
    }, [policies, itemPrice, itemQuantity]);

    const calculateSelectedDiscount = () => {
        let totalDiscount = 0;
        selectedPolicyIds.forEach(id => {
            const policy = policies.find(p => p.id === id);
            if (policy) {
                if (policy.discount_type === 'percentage') {
                    totalDiscount += (baseTotal * policy.discount_value) / 100;
                } else {
                    totalDiscount += Number(policy.discount_value) || 0;
                }
            }
        });
        // Cap discount at baseTotal
        return Math.min(totalDiscount, baseTotal);
    };

    const calculatedDiscountAmount = calculateSelectedDiscount();

    const handleToggle = (policyId: string) => {
        setSelectedPolicyIds(prev => 
            prev.includes(policyId) 
                ? prev.filter(id => id !== policyId)
                : [...prev, policyId]
        );
    };

    const handleApply = () => {
        onApply(calculatedDiscountAmount);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant={currentDiscountAmount > 0 ? "default" : "outline"}
                    size="sm" 
                    className="w-full justify-between h-8 text-xs font-medium"
                >
                    <span className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        Discount
                    </span>
                    {currentDiscountAmount > 0 && (
                        <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded text-[10px]">
                            {formatCurrency(currentDiscountAmount)}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Apply Discount Policies</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Loading policies...</div>
                    ) : policies.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">No discount policies available.</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Applicable Policies */}
                            {applicablePolicies.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Applicable</h4>
                                    {applicablePolicies.map(policy => (
                                        <div 
                                            key={policy.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                                selectedPolicyIds.includes(policy.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                            onClick={() => handleToggle(policy.id)}
                                        >
                                            <Checkbox 
                                                checked={selectedPolicyIds.includes(policy.id)} 
                                                onCheckedChange={() => handleToggle(policy.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium leading-none">{policy.name}</p>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {policy.discount_type === 'percentage' 
                                                            ? `${policy.discount_value}% OFF`
                                                            : `${formatCurrency(policy.discount_value)} OFF`}
                                                    </Badge>
                                                </div>
                                                {policy.description && (
                                                    <p className="text-xs text-muted-foreground">{policy.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Non-Applicable Policies */}
                            {nonApplicablePolicies.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4">Not Applicable</h4>
                                    {nonApplicablePolicies.map(policy => (
                                        <div 
                                            key={policy.id}
                                            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 opacity-70 cursor-not-allowed"
                                        >
                                            <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium leading-none text-muted-foreground">{policy.name}</p>
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                        {policy.discount_type === 'percentage' 
                                                            ? `${policy.discount_value}% OFF`
                                                            : `${formatCurrency(policy.discount_value)} OFF`}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Info className="h-3 w-3" />
                                                    {policy.condition_type === 'min_qty' && `Requires minimum ${policy.condition_value} items.`}
                                                    {policy.condition_type === 'min_amount' && `Requires minimum ${formatCurrency(policy.condition_value || 0)} line total.`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between items-center border-t pt-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Total Discount: </span>
                        <span className="font-bold text-primary text-lg">{formatCurrency(calculatedDiscountAmount)}</span>
                    </div>
                    <Button onClick={handleApply} disabled={isLoading}>
                        Apply to Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
