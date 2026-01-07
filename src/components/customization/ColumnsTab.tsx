/**
 * ColumnsTab Component
 * Table columns settings tab for customization dialog
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { InvoiceCustomization } from '@/types/customization';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ColumnsTabProps {
    customization: InvoiceCustomization;
    onUpdate: (path: string, value: any) => void;
    onColumnToggle: (columnId: string, enabled: boolean) => void;
    onColumnReorder: (result: any) => void;
}

export function ColumnsTab({
    customization,
    onUpdate,
    onColumnToggle,
    onColumnReorder
}: ColumnsTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Table Columns</CardTitle>
                    <CardDescription>
                        Enable/disable columns and drag to reorder
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DragDropContext onDragEnd={onColumnReorder}>
                        <Droppable droppableId="columns">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {customization.table.columns
                                        .sort((a, b) => a.order - b.order)
                                        .map((column, index) => (
                                            <Draggable
                                                key={column.id}
                                                draggableId={column.id}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div {...provided.dragHandleProps}>
                                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                            </div>
                                                            <Label className="cursor-pointer">
                                                                {column.label}
                                                            </Label>
                                                        </div>
                                                        <Switch
                                                            checked={column.enabled}
                                                            onCheckedChange={(checked) =>
                                                                onColumnToggle(column.id, checked)
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <div className="mt-6 pt-6 border-t space-y-3">
                        <Label className="text-base font-semibold">Additional Options</Label>
                        <div className="flex items-center justify-between">
                            <Label>Show Serial Numbers</Label>
                            <Switch
                                checked={customization.table.showSerialNumbers}
                                onCheckedChange={(checked) => onUpdate('table.showSerialNumbers', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ColumnsTab;
