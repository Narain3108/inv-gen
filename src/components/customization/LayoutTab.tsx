/**
 * LayoutTab Component
 * Page layout settings tab for customization dialog
 */

'use client';

import React from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceCustomization } from '@/types/customization';

interface LayoutTabProps {
    customization: InvoiceCustomization;
    onUpdate: (path: string, value: any) => void;
}

export function LayoutTab({ customization, onUpdate }: LayoutTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Page Layout</CardTitle>

                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelSelect
                            id="pageSize"
                            label="Page Size"
                            value={customization.pageSize}
                            onValueChange={(value: string) => onUpdate('pageSize', value)}
                        >
                            <SelectContent>
                                <SelectItem value="A4">A4</SelectItem>
                                <SelectItem value="Letter">Letter</SelectItem>
                            </SelectContent>
                        </FloatingLabelSelect>

                        <FloatingLabelSelect
                            id="orientation"
                            label="Orientation"
                            value={customization.orientation}
                            onValueChange={(value: string) => onUpdate('orientation', value)}
                        >
                            <SelectContent>
                                <SelectItem value="portrait">Portrait</SelectItem>
                                <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                        </FloatingLabelSelect>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Margins (in pixels)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FloatingLabelInput
                                id="marginTop"
                                label="Top"
                                type="number"
                                value={customization.margins.top}
                                onChange={(e) => onUpdate('margins.top', parseInt(e.target.value))}
                            />
                            <FloatingLabelInput
                                id="marginRight"
                                label="Right"
                                type="number"
                                value={customization.margins.right}
                                onChange={(e) => onUpdate('margins.right', parseInt(e.target.value))}
                            />
                            <FloatingLabelInput
                                id="marginBottom"
                                label="Bottom"
                                type="number"
                                value={customization.margins.bottom}
                                onChange={(e) => onUpdate('margins.bottom', parseInt(e.target.value))}
                            />
                            <FloatingLabelInput
                                id="marginLeft"
                                label="Left"
                                type="number"
                                value={customization.margins.left}
                                onChange={(e) => onUpdate('margins.left', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Label>Show Page Numbers</Label>
                        <Switch
                            checked={customization.showPageNumbers}
                            onCheckedChange={(checked) => onUpdate('showPageNumbers', checked)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LayoutTab;
