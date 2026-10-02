'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, RefreshCw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// html2pdf imported dynamically

// Auto-resizing textarea that looks like plain text
const AutoTextarea = ({ value, onChange, className = '', placeholder = '', minRows = 1, readOnly = false }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (!readOnly) adjustHeight();
  }, [value, readOnly]);

  if (readOnly) {
    return <div className={`whitespace-pre-wrap ${className}`}>{value || placeholder}</div>;
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      className={`resize-none overflow-hidden bg-transparent border border-transparent outline-none w-full hover:border-gray-200 focus:border-blue-400 focus:bg-blue-50/50 rounded px-1 py-0.5 transition-colors ${className}`}
      rows={minRows}
    />
  );
};

// Simple input that looks like plain text
const EditableInput = ({ value, onChange, className = '', placeholder = '', readOnly = false }: any) => {
  if (readOnly) {
    return <div className={`px-1 py-0.5 ${className}`}>{value || placeholder}</div>;
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent border border-transparent outline-none w-full hover:border-gray-200 focus:border-blue-400 focus:bg-blue-50/50 rounded px-1 py-0.5 transition-colors ${className}`}
    />
  );
};

export default function QuickInvoicePage() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [data, setData] = useState({
    companyName: 'SRIVARI PHOTOGRAPHY',
    tagline: 'Professional Photography & Videography Services',
    invoiceTitle: 'Invoice / Service Details',
    invoiceDate: '02 Oct 2026',
    invoiceNumber: 'INV-2026-001',
    billedTo: '',
    meta: [
      { id: '1', label: 'Project', value: '#Love Promotion' },
      { id: '2', label: 'Service Provider', value: 'Srivari Photography' },
    ],
    items: [
      {
        id: '1',
        title: 'DAY 1 — 30 September 2026',
        subtitle: 'Service: Interview Coverage',
        details: '* Number of Interviews: 4\n* Camera Team: 3 Cameramen\n* Camera: Sony A7 IV\n* Lighting: 4 Lights\n* Audio: 4 Microphones\n* Deliverables: All 4 interviews uploaded to Google Drive',
        amount: '₹25,000',
      },
      {
        id: '2',
        title: 'DAY 2 — 1 October 2026',
        subtitle: 'Service: Interview Coverage',
        details: '* Number of Interviews: 9\n* Camera Team: 3 Cameramen\n* Camera: Sony A7 IV\n* Lighting: 4 Lights\n* Audio: 4 Microphones\n* Deliverables: All 9 interviews uploaded to Google Drive',
        amount: '₹32,000',
      },
    ],
    summary: [
      { id: '1', date: '30.09.2026', service: 'Day 1 – 4 Interviews', amount: '₹25,000' },
      { id: '2', date: '01.10.2026', service: 'Day 2 – 9 Interviews', amount: '₹32,000' },
    ],
    grandTotal: '₹57,000',
    notes: 'Note: The above charges include camera crew, Sony A7 IV cameras, lighting, microphones, interview coverage, and uploading the completed interviews to Google Drive.',
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleDownload = async () => {
    const fileName = window.prompt('Enter filename for the downloaded invoice:', `${data.companyName} Invoice`);
    if (!fileName) return; // User cancelled

    if (!invoiceRef.current) return;
    
    // Hide UI elements before taking the snapshot
    setIsGeneratingPdf(true);
    
    // Wait for React to re-render without the UI elements
    setTimeout(async () => {
      try {
        const element = invoiceRef.current as HTMLElement;
        if (!element) return;
        const { jsPDF } = await import('jspdf');
        const htmlToImage = await import('html-to-image');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pageHeight = 297;
        const paddingMm = 15; // 15mm padding
        const contentWidth = pdfWidth - (paddingMm * 2);
        
        let currentY = paddingMm;
        
        // Find all blocks
        const blocks = Array.from(invoiceRef.current!.querySelectorAll('[data-pdf-block="true"]')) as HTMLElement[];
        
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const imgData = await htmlToImage.toPng(block, { pixelRatio: 2 });
          
          const img = new Image();
          img.src = imgData;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const imgHeightMm = (img.height * contentWidth) / img.width;
          
          // If block doesn't fit and it's not the first item on the page, create new page
          if (currentY + imgHeightMm > (pageHeight - paddingMm) && currentY > paddingMm) {
            pdf.addPage();
            currentY = paddingMm;
          }
          
          pdf.addImage(imgData, 'PNG', paddingMm, currentY, contentWidth, imgHeightMm);
          currentY += imgHeightMm;
        }
        
        pdf.save(`${fileName}.pdf`);
      } catch (err) {
        console.error("Error generating PDF", err);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        // Show UI elements again
        setIsGeneratingPdf(false);
      }
    }, 150); // Small delay to ensure DOM is updated
  };

  return (
    <div className={`min-h-screen bg-gray-50/50 ${isGeneratingPdf ? 'bg-white flex justify-start items-start' : 'py-8'}`}>
      
      {/* Action Bar */}
      {!isGeneratingPdf && (
        <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Invoice Generator</h1>
            <p className="text-sm text-gray-500">Click any text to edit. Changes are not saved.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Document Wrapper */}
      <div 
        ref={invoiceRef}
        className={`bg-white ${!isGeneratingPdf ? 'max-w-4xl mx-auto shadow-sm border rounded-xl p-10' : 'w-[794px] m-0'}`}
      >
        <div data-pdf-block="true" className="bg-white">
        {/* Header section with Logo */}
        <div className="mb-10 flex justify-between items-start">
          
          {/* Left: Logo */}
          <div className="w-1/4 flex justify-start">
            <img src="/logo.png" alt="Studio Logo" className="w-24 h-24 object-contain rounded shadow-sm bg-white border border-gray-200" />
          </div>

          {/* Center: Company Name & Tagline */}
          <div className="w-1/2 flex flex-col items-center text-center">
            <EditableInput
              value={data.companyName}
              onChange={(v: string) => setData({ ...data, companyName: v })}
              readOnly={isGeneratingPdf}
              className="text-3xl font-bold text-center uppercase tracking-wider mb-2 font-serif"
              placeholder="COMPANY NAME"
            />
            <EditableInput
              value={data.tagline}
              onChange={(v: string) => setData({ ...data, tagline: v })}
              readOnly={isGeneratingPdf}
              className="text-gray-500 text-center"
              placeholder="Company Tagline or Address"
            />
          </div>
          
          {/* Right: Empty for layout balance */}
          <div className="w-1/4"></div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <EditableInput
            value={data.invoiceTitle}
            onChange={(v: string) => setData({ ...data, invoiceTitle: v })}
            readOnly={isGeneratingPdf}
            className="text-xl font-bold border-b-2 border-gray-800 pb-2"
            placeholder="Invoice Title"
          />
        </div>

        {/* Billed To */}
        <div className="mb-6">
          <div className="font-bold text-gray-800 mb-1">Billing To:</div>
          <AutoTextarea
            value={data.billedTo}
            onChange={(v: string) => setData({ ...data, billedTo: v })}
            readOnly={isGeneratingPdf}
            className="w-1/2 text-gray-900"
            placeholder="Client Name&#10;Address Line 1&#10;Address Line 2&#10;Contact"
            minRows={3}
          />
        </div>

        {/* Invoice Primary Details */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center">
            <div className="w-1/3 flex items-center font-semibold text-gray-800">
              Invoice No<span className="ml-auto mr-2">:</span>
            </div>
            <div className="w-2/3">
              <EditableInput
                value={data.invoiceNumber}
                onChange={(v: string) => setData({ ...data, invoiceNumber: v })}
                readOnly={isGeneratingPdf}
                className="w-full text-gray-900"
                placeholder="INV-001"
              />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-1/3 flex items-center font-semibold text-gray-800">
              Date<span className="ml-auto mr-2">:</span>
            </div>
            <div className="w-2/3">
              <EditableInput
                value={data.invoiceDate}
                onChange={(v: string) => setData({ ...data, invoiceDate: v })}
                readOnly={isGeneratingPdf}
                className="w-full text-gray-900"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
        </div>

        {/* Meta Info (Project, Provider, etc.) */}
        <div className="mb-8 space-y-1">
          {data.meta.map((metaItem, index) => (
            <div key={metaItem.id} className="flex group items-center">
              <div className="w-1/3 flex">
                <EditableInput
                  value={metaItem.label}
                  onChange={(v: string) => {
                    const newMeta = [...data.meta];
                    newMeta[index].label = v;
                    setData({ ...data, meta: newMeta });
                  }}
                  readOnly={isGeneratingPdf}
                  className="font-semibold"
                  placeholder="Label (e.g. Project)"
                />
                <span className="mr-2 font-semibold flex items-center">:</span>
              </div>
              <div className="w-2/3 flex items-center">
                <EditableInput
                  value={metaItem.value}
                  onChange={(v: string) => {
                    const newMeta = [...data.meta];
                    newMeta[index].value = v;
                    setData({ ...data, meta: newMeta });
                  }}
                  readOnly={isGeneratingPdf}
                  placeholder="Value"
                />
                {!isGeneratingPdf && (
                  <button 
                    onClick={() => setData({ ...data, meta: data.meta.filter(m => m.id !== metaItem.id) })}
                    className="ml-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!isGeneratingPdf && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setData({ ...data, meta: [...data.meta, { id: generateId(), label: '', value: '' }] })}
              className="text-blue-500 hover:text-blue-700 h-8 px-2 mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Detail Field
            </Button>
          )}
        </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
          {data.items.map((item, index) => (
            <div key={item.id} data-pdf-block="true" className="mb-8 group relative break-inside-avoid bg-white">
              <Separator className="mb-6 bg-gray-300" />
              
              {!isGeneratingPdf && (
                <button 
                  onClick={() => setData({ ...data, items: data.items.filter(i => i.id !== item.id) })}
                  className="absolute -right-4 top-0 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 bg-white p-1 rounded-full shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <div className="mb-2">
                <EditableInput
                  value={item.title}
                  onChange={(v: string) => {
                    const newItems = [...data.items];
                    newItems[index].title = v;
                    setData({ ...data, items: newItems });
                  }}
                  readOnly={isGeneratingPdf}
                  className="font-bold text-lg text-gray-900"
                  placeholder="e.g. DAY 1 — 30 September 2026"
                />
              </div>

              <div className="mb-3">
                <EditableInput
                  value={item.subtitle}
                  onChange={(v: string) => {
                    const newItems = [...data.items];
                    newItems[index].subtitle = v;
                    setData({ ...data, items: newItems });
                  }}
                  readOnly={isGeneratingPdf}
                  className="font-medium text-gray-800"
                  placeholder="e.g. Service: Interview Coverage"
                />
              </div>

              <div className="pl-4 mb-4 border-l-2 border-gray-300">
                <AutoTextarea
                  value={item.details}
                  onChange={(v: string) => {
                    const newItems = [...data.items];
                    newItems[index].details = v;
                    setData({ ...data, items: newItems });
                  }}
                  readOnly={isGeneratingPdf}
                  className="text-gray-800 leading-relaxed font-mono text-sm"
                  placeholder="* Item detail 1..."
                  minRows={3}
                />
              </div>

              <div className="flex items-center justify-between font-semibold mt-4">
                <span className="text-gray-900">Total Amount:</span>
                <div className="w-48 text-right">
                  <EditableInput
                    value={item.amount}
                    onChange={(v: string) => {
                      const newItems = [...data.items];
                      newItems[index].amount = v;
                      setData({ ...data, items: newItems });
                    }}
                    readOnly={isGeneratingPdf}
                    className="text-right text-lg text-gray-900"
                    placeholder="₹0"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Separator className="mb-6 bg-gray-300" />
          
          {!isGeneratingPdf && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setData({ 
                  ...data, 
                  items: [...data.items, { id: generateId(), title: '', subtitle: '', details: '', amount: '' }] 
                })}
                className="border-dashed border-2 text-gray-500 hover:text-gray-900 w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Service Block
              </Button>
            </div>
          )}
        </div>

        <div data-pdf-block="true" className="bg-white pb-10">
        {/* Payment Summary */}
        <div className="mb-12">
          <h3 className="font-bold text-lg mb-4 tracking-wide text-gray-900">PAYMENT SUMMARY</h3>
          
          <div className="border border-gray-400 rounded-lg overflow-hidden">
            <div className="flex bg-gray-200 font-semibold p-2 text-gray-900">
              <div className="w-1/4 px-2">Date</div>
              <div className="w-2/4 px-2">Service</div>
              <div className="w-1/4 px-2 text-right">Amount</div>
              {!isGeneratingPdf && <div className="w-8"></div>}
            </div>
            
            {data.summary.map((row, index) => (
              <div key={row.id} className="flex border-t border-gray-300 p-2 items-center group break-inside-avoid">
                <div className="w-1/4 px-1">
                  <EditableInput
                    value={row.date}
                    onChange={(v: string) => {
                      const newSum = [...data.summary];
                      newSum[index].date = v;
                      setData({ ...data, summary: newSum });
                    }}
                    readOnly={isGeneratingPdf}
                    placeholder="Date"
                  />
                </div>
                <div className="w-2/4 px-1">
                  <EditableInput
                    value={row.service}
                    onChange={(v: string) => {
                      const newSum = [...data.summary];
                      newSum[index].service = v;
                      setData({ ...data, summary: newSum });
                    }}
                    readOnly={isGeneratingPdf}
                    placeholder="Service Description"
                  />
                </div>
                <div className="w-1/4 px-1 text-right font-medium">
                  <EditableInput
                    value={row.amount}
                    onChange={(v: string) => {
                      const newSum = [...data.summary];
                      newSum[index].amount = v;
                      setData({ ...data, summary: newSum });
                    }}
                    readOnly={isGeneratingPdf}
                    className="text-right text-gray-900"
                    placeholder="₹0"
                  />
                </div>
                {!isGeneratingPdf && (
                  <div className="w-8 flex justify-center">
                    <button 
                      onClick={() => setData({ ...data, summary: data.summary.filter(s => s.id !== row.id) })}
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex border-t-2 border-gray-500 p-2 items-center bg-transparent">
              <div className={`${!isGeneratingPdf ? 'w-3/4' : 'w-3/4'} px-2 font-bold text-right text-gray-900`}>Grand Total:</div>
              <div className="w-1/4 px-1 text-right font-bold text-lg">
                <EditableInput
                  value={data.grandTotal}
                  onChange={(v: string) => setData({ ...data, grandTotal: v })}
                  readOnly={isGeneratingPdf}
                  className="text-right text-gray-900"
                  placeholder="₹0"
                />
              </div>
              {!isGeneratingPdf && <div className="w-8"></div>}
            </div>
          </div>
          
          {!isGeneratingPdf && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setData({ 
                ...data, 
                summary: [...data.summary, { id: generateId(), date: '', service: '', amount: '' }] 
              })}
              className="text-blue-500 hover:text-blue-700 h-8 px-2 mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Summary Row
            </Button>
          )}
        </div>

        {/* Footer Notes */}
        <div>
          <AutoTextarea
            value={data.notes}
            onChange={(v: string) => setData({ ...data, notes: v })}
            readOnly={isGeneratingPdf}
            className="text-sm text-gray-800 italic"
            placeholder="Add notes, terms & conditions..."
            minRows={2}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
