/**
 * Reusable Tabbed Form Layout Component
 * 
 * A shared component that provides consistent tabbed navigation for forms.
 * Follows DRY principle - single source of truth for tab UI behavior.
 * 
 * Usage:
 * <TabFormLayout
 *   tabs={[
 *     { key: 'basic', label: 'Basic Info', content: <BasicInfoContent /> },
 *     { key: 'details', label: 'Details', content: <DetailsContent /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   onNext={handleNext}
 *   onBack={handleBack}
 *   onSubmit={handleSubmit}
 *   isLoading={isLoading}
 *   submitLabel="Create Item"
 *   onCancel={onCancel}
 * />
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export interface TabConfig {
    key: string;
    label: string;
    content: React.ReactNode;
    /** Fields to validate before allowing navigation away from this tab */
    fieldsToValidate?: string[];
}

interface TabFormLayoutProps {
    /** Array of tab configurations */
    tabs: TabConfig[];
    /** Currently active tab key */
    activeTab: string;
    /** Callback when tab changes */
    onTabChange: (tabKey: string) => void;
    /** Callback for Next button (validates current tab, moves to next) */
    onNext: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    /** Callback for Back button */
    onBack: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    /** Whether form is in loading state */
    isLoading?: boolean;
    /** Label for submit button */
    submitLabel?: string;
    /** Callback for cancel action */
    onCancel?: () => void;
    /** Additional class names for the container */
    className?: string;
}

export function TabFormLayout({
    tabs,
    activeTab,
    onTabChange,
    onNext,
    onBack,
    isLoading = false,
    submitLabel = 'Submit',
    onCancel,
    className = '',
}: TabFormLayoutProps) {
    const tabKeys = tabs.map((t) => t.key);
    const currentIndex = tabKeys.indexOf(activeTab);
    const isFirstTab = currentIndex === 0;
    const isLastTab = currentIndex === tabKeys.length - 1;

    return (
        <div className={`space-y-6 ${className}`}>
            <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-4">
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Navigation Footer */}
            <div className="flex justify-between pt-4 border-t">
                <div>
                    {!isFirstTab && (
                        <Button type="button" variant="outline" onClick={onBack}>
                            Back
                        </Button>
                    )}
                </div>
                <div className="flex gap-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    {!isLastTab ? (
                        <Button
                            type="button"
                            onClick={onNext}
                            className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TabFormLayout;
