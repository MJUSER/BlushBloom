import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Sale } from '../../db/db';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Save, X, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

interface SaleFormProps {
    onClose: () => void;
    initialData?: Sale;
}

export const SaleForm: React.FC<SaleFormProps> = ({ onClose, initialData }) => {
    const batches = useLiveQuery(() => db.batches.toArray());
    const allSales = useLiveQuery(() => db.sales.toArray());

    // Form State
    const [batchId, setBatchId] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [qty, setQty] = useState(1);
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [status, setStatus] = useState<Sale['status']>('New');
    const [image, setImage] = useState<Blob | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Derived State
    const selectedBatch = batches?.find(b => b.id === Number(batchId));
    const remainingStock = selectedBatch ? (selectedBatch.targetQty - (allSales?.filter(s => s.batchId === selectedBatch.id && s.id !== initialData?.id).reduce((sum, s) => sum + s.qty, 0) || 0)) : 0;

    useEffect(() => {
        if (initialData) {
            setBatchId(initialData.batchId);
            setDate(initialData.date);
            setQty(initialData.qty);
            setCustName(initialData.custName);
            setCustPhone(initialData.custPhone || '');
            setPrice(initialData.price);
            setStatus(initialData.status);
            if (initialData.paymentScreenshot && initialData.paymentScreenshot instanceof Blob) {
                setImage(initialData.paymentScreenshot);
                setImagePreview(URL.createObjectURL(initialData.paymentScreenshot));
            }
        }
    }, [initialData]);

    // Auto-calculate suggested price
    useEffect(() => {
        if (selectedBatch && qty > 0 && !initialData) { // Only auto-calc for new sales
            // Default markup 1.5x
            setPrice(Number((selectedBatch.unitCost * 1.5 * qty).toFixed(2)));
        }
    }, [selectedBatch, qty]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!batchId || !custName || !price) return alert('Please fill required fields');

        const profit = Number(price) - ((selectedBatch?.unitCost || 0) * qty);

        const saleData: Sale = {
            batchId: Number(batchId),
            date,
            custName,
            custPhone,
            status,
            qty,
            price: Number(price),
            profit,
            paymentScreenshot: image || undefined
        };

        if (initialData && initialData.id) {
            await db.sales.update(initialData.id, saleData);
        } else {
            await db.sales.add(saleData);
        }
        onClose();
    };

    return (
        <Card className="w-full shadow-2xl">
            <CardHeader className="flex items-center justify-between sticky top-0 bg-white dark:bg-card-dark z-10 border-b">
                <CardTitle>{initialData ? 'Edit Sale' : 'Record New Sale'}</CardTitle>
                <button onClick={onClose}><X /></button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

                {/* Batch & Qty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Batch</label>
                        <select
                            value={batchId}
                            onChange={e => setBatchId(Number(e.target.value))}
                            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
                        >
                            <option value="">-- Select Batch --</option>
                            {batches?.map(b => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Name</label>
                        <input type="text" value={custName} onChange={e => setCustName(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                        <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600" />
                    </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Sale Price (₹)</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-blue-50 dark:bg-blue-900/20 font-bold text-lg" />
                        <p className="text-xs text-gray-500 mt-1">Suggested: ₹{(selectedBatch ? selectedBatch.unitCost * 1.5 * qty : 0).toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-600">
                            <option value="New">New Order</option>
                            <option value="Pending">Payment Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Image Attachment */}
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input type="file" id="imgUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <label htmlFor="imgUpload" className="cursor-pointer flex flex-col items-center gap-2">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-lg" />
                        ) : (
                            <>
                                <Upload className="text-gray-400" size={32} />
                                <span className="text-gray-500 text-sm">Upload Payment Screenshot</span>
                            </>
                        )}
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="w-full sm:w-auto"><Save className="mr-2" size={18} /> Save Sale</Button>
                </div>

            </CardContent>
        </Card>
    );
};
