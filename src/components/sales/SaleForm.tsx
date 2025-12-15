import React, { useState, useEffect } from 'react';
import { useBatches, useSales, saleService } from '../../hooks/useFirestore';
import { type Sale } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Save, X, Upload, AlertTriangle, CheckCircle, Truck, Download, FileText, MapPin } from 'lucide-react';

interface SaleFormProps {
    onClose: () => void;
    initialData?: Sale;
}

// Utility to convert File to Base64
const convertBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = (error) => reject(error);
    });
};

export const SaleForm: React.FC<SaleFormProps> = ({ onClose, initialData }) => {
    // Data Hooks
    const { data: batches } = useBatches();
    const { data: allSales } = useSales();

    // Form State
    const [batchId, setBatchId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [qty, setQty] = useState(1);
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custAddress, setCustAddress] = useState(''); // New
    const [notes, setNotes] = useState(''); // New

    const [basePrice, setBasePrice] = useState<number | ''>('');
    const [discount, setDiscount] = useState<number>(0);
    const [status, setStatus] = useState<Sale['status']>('New');
    const [courier, setCourier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');

    // Image
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Derived State
    const selectedBatch = batches.find(b => b.id === batchId);

    // Calculate stock
    const batchSalesQty = allSales
        .filter(s => s.batchId === batchId && s.id !== initialData?.id && s.status !== 'Cancelled')
        .reduce((sum, s) => sum + s.qty, 0);
    const remainingStock = selectedBatch ? (selectedBatch.targetQty - batchSalesQty) : 0;

    useEffect(() => {
        if (initialData) {
            setBatchId(initialData.batchId);
            setDate(initialData.date);
            setQty(initialData.qty);
            setCustName(initialData.custName);
            setCustPhone(initialData.custPhone || '');
            setCustAddress(initialData.custAddress || '');
            setNotes(initialData.notes || '');

            setBasePrice(initialData.price + (initialData.discount || 0)); // Restore base price

            setStatus(initialData.status);
            setDiscount(initialData.discount || 0);
            setCourier(initialData.courier || '');
            setTrackingNumber(initialData.trackingNumber || '');

            if (initialData.paymentScreenshot) {
                setImagePreview(initialData.paymentScreenshot);
            }
        }
    }, [initialData]);

    // Auto-calculate suggested price
    useEffect(() => {
        if (selectedBatch && qty > 0 && !initialData) {
            const unitPrice = selectedBatch.sellingPrice || (selectedBatch.unitCost * 1.5);
            setBasePrice(Number((unitPrice * qty).toFixed(2)));
        }
    }, [selectedBatch, qty]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await convertBase64(file);
            setImagePreview(base64);
        }
    };

    const handleSave = async () => {
        if (!batchId || !custName || !basePrice) return alert('Please fill required fields');

        const finalPrice = Number(basePrice) - discount;
        const profit = finalPrice - ((selectedBatch?.unitCost || 0) * qty);

        const saleData: Sale = {
            batchId,
            date,
            custName,
            custPhone,
            custAddress, // New
            status,
            qty,
            price: finalPrice,
            profit,
            paymentScreenshot: imagePreview || undefined,

            // New Fields
            discount,
            courier,
            trackingNumber,
            notes // New
        };

        try {
            if (initialData && initialData.id) {
                await saleService.update(initialData.id, saleData);
            } else {
                await saleService.add(saleData);
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save sale.");
        }
    };

    return (
        <Card className="w-full shadow-2xl h-[90vh] flex flex-col">
            <CardHeader className="flex items-center justify-between sticky top-0 bg-white dark:bg-card-dark z-10 border-b flex-shrink-0">
                <CardTitle>{initialData ? 'Edit Sale' : 'Record New Sale'}</CardTitle>
                <button onClick={onClose}><X /></button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 overflow-y-auto flex-grow p-6">

                {/* Batch & Qty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Batch</label>
                        <select
                            value={batchId}
                            onChange={e => setBatchId(e.target.value)}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
                        >
                            <option value="">-- Select Batch --</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name} (₹{b.unitCost.toFixed(2)}/u)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600" />
                    </div>
                </div>

                {/* Stock Warning */}
                {selectedBatch && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${remainingStock < qty ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'
                        }`}>
                        {remainingStock < qty ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                        <span>Stock Available: {remainingStock} units. {remainingStock < qty ? '(Overselling!)' : ''}</span>
                    </div>
                )}

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-sm text-gray-500 uppercase"><FileText size={14} /> Customer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer Name</label>
                            <input type="text" value={custName} onChange={e => setCustName(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                            <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1"><MapPin size={14} className="inline mr-1" /> Shipping Address</label>
                            <textarea
                                value={custAddress}
                                onChange={e => setCustAddress(e.target.value)}
                                rows={2}
                                placeholder="Full address with pincode..."
                                className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-sm text-gray-500 uppercase"><Truck size={14} /> Delivery Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Courier Service</label>
                            <input
                                type="text"
                                placeholder="DTDC, SpeedPost..."
                                value={courier}
                                onChange={e => setCourier(e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tracking Number</label>
                            <input
                                type="text"
                                placeholder="Tracking #"
                                value={trackingNumber}
                                onChange={e => setTrackingNumber(e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Total Bill (₹)</label>
                        <input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-blue-50 dark:bg-blue-900/20 font-bold text-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-red-500">Discount (₹)</label>
                        <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 font-bold text-red-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Final Amount</label>
                        <div className="w-full p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-extrabold text-lg">
                            ₹{(Number(basePrice) - discount).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Order Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600">
                        <option value="New">New Order</option>
                        <option value="Pending">Payment Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium mb-1">Private Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Internal notes about this order..."
                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 bg-yellow-50 dark:bg-yellow-900/10"
                    />
                </div>

                {/* Image Attachment with Download */}
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors relative">
                    <input type="file" id="imgUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />

                    {imagePreview ? (
                        <div className="relative group">
                            <img src={imagePreview} alt="Preview" className="h-48 object-contain rounded-lg shadow-md mx-auto" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                <label htmlFor="imgUpload" className="cursor-pointer bg-white text-black px-3 py-1 rounded-full text-sm font-bold hover:bg-gray-100">
                                    Change
                                </label>
                                <a href={imagePreview} download={`receipt-${custName}-${date}.png`} className="bg-primary-blue text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-600 flex items-center gap-1">
                                    <Download size={14} /> Download
                                </a>
                            </div>
                        </div>
                    ) : (
                        <label htmlFor="imgUpload" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-gray-500 text-sm">Upload Payment Receipt / Document</span>
                        </label>
                    )}
                </div>

            </CardContent>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-slate-900 flex-shrink-0">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto"><Save className="mr-2" size={18} /> Save Sale</Button>
            </div>
        </Card>
    );
};
