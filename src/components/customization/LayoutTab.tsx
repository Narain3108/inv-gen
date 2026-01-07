/**
 * LayoutTab Component
 * Page layout settings tab for customization dialog
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
                    <CardDescription>Configure page size and margins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pageSize">Page Size</Label>
                            <Select
                                value={customization.pageSize}
                                onValueChange={(value) => onUpdate('pageSize', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A4">A4</SelectItem>
                                    <SelectItem value="Letter">Letter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="orientation">Orientation</Label>
                            <Select
                                value={customization.orientation}
                                onValueChange={(value) => onUpdate('orientation', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="landscape">Landscape</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Margins (in pixels)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="marginTop">Top</Label>
                                <Input
                                    id="marginTop"
                                    type="number"
                                    value={customization.margins.top}
                                    onChange={(e) => onUpdate('margins.top', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marginRight">Right</Label>
                                <Input
                                    id="marginRight"
                                    type="number"
                                    value={customization.margins.right}
                                    onChange={(e) => onUpdate('margins.right', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marginBottom">Bottom</Label>
                                <Input
                                    id="marginBottom"
                                    type="number"
                                    value={customization.margins.bottom}
                                    onChange={(e) => onUpdate('margins.bottom', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marginLeft">Left</Label>
                                <Input
                                    id="marginLeft"
                                    type="number"
                                    value={customization.margins.left}
                                    onChange={(e) => onUpdate('margins.left', parseInt(e.target.value))}
                                />
                            </div>
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
