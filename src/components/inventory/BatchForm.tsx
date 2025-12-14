import React, { useEffect, useState } from 'react';
import { db, type Batch } from '../../db/db';
import { Button } from '../ui/Button';
import { Save, X, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface BatchFormProps {
    onClose: () => void;
    initialData?: Batch;
}

const COST_ITEMS = [
    { id: 'mat', label: 'Material Fabric', defPrice: 179, defQty: 45 },
    { id: 'lin', label: 'Lining', defPrice: 70, defQty: 40 },
    { id: 'mship', label: 'Material Shipping', defPrice: 350, defQty: 1 },
    { id: 'vship', label: 'Vendor Shipping', defPrice: 100, defQty: 10 },
    { id: 'stitch', label: 'Stitching', defPrice: 550, defQty: 10 },
    { id: 'pack', label: 'Packaging', defPrice: 10, defQty: 10 },
    { id: 'cship', label: 'Customer Shipment', defPrice: 200, defQty: 10 }
];

export const BatchForm: React.FC<BatchFormProps> = ({ onClose, initialData }) => {
    const [name, setName] = useState('');
    const [inputs, setInputs] = useState<Record<string, number>>({});

    // Initialize state
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setInputs(initialData.inputs);
        } else {
            const defaults: Record<string, number> = {};
            COST_ITEMS.forEach(item => {
                defaults[`p_${item.id}`] = item.defPrice;
                defaults[`q_${item.id}`] = item.defQty;
            });
            setInputs(defaults);
        }
    }, [initialData]);

    const handleInputChange = (key: string, value: string) => {
        setInputs(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    // Calculations
    const calculateTotal = () => {
        let total = 0;
        COST_ITEMS.forEach(item => {
            const p = inputs[`p_${item.id}`] || 0;
            const q = inputs[`q_${item.id}`] || 0;
            total += p * q;
        });
        return total;
    };

    const grandTotal = calculateTotal();
    // Target items comes from Stitching Quantity usually, or we can make it explicit. 
    // In the original app, it used 'q_stitch' as the target quantity.
    const targetQty = inputs['q_stitch'] || 1;
    const unitCost = targetQty > 0 ? grandTotal / targetQty : 0;

    const handleSave = async () => {
        if (!name.trim()) return alert('Please enter a batch name');

        const batchData: Batch = {
            name,
            targetQty,
            grandTotal,
            unitCost,
            inputs
        };

        if (initialData && initialData.id) {
            await db.batches.update(initialData.id, batchData as any);
        } else {
            await db.batches.add(batchData);
        }
        onClose();
    };

    return (
        <Card className="w-full shadow-2xl">
            <CardHeader className="flex flex-row justify-between items-center sticky top-0 bg-white dark:bg-card-dark z-10 border-b">
                <CardTitle><Calculator className="text-primary-blue" /> {initialData ? 'Edit Batch Plan' : 'New Batch Plan'}</CardTitle>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
            </CardHeader>

            <CardContent className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Batch Name / ID</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Summer Collection 2025"
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-border-subtle dark:border-slate-600 border rounded-xl focus:ring-2 focus:ring-primary-blue outline-none"
                    />
                </div>

                <div className="overflow-x-auto border border-border-subtle dark:border-slate-600 rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-slate-800 font-medium text-gray-600 dark:text-gray-400">
                            <tr>
                                <th className="p-3 w-1/3">Item</th>
                                <th className="p-3 w-1/4">Unit Price (₹)</th>
                                <th className="p-3 w-1/4">Quantity</th>
                                <th className="p-3 text-right">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {COST_ITEMS.map(item => {
                                const p = inputs[`p_${item.id}`] || 0;
                                const q = inputs[`q_${item.id}`] || 0;
                                const total = p * q;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-medium">{item.label}</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={inputs[`p_${item.id}`] ?? ''}
                                                onChange={e => handleInputChange(`p_${item.id}`, e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-primary-blue"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={inputs[`q_${item.id}`] ?? ''}
                                                onChange={e => handleInputChange(`q_${item.id}`, e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-primary-blue"
                                            />
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                                            {total.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-primary-blue/5 dark:bg-blue-900/20 font-bold border-t-2 border-primary-blue/20">
                                <td className="p-4 text-right" colSpan={3}>GRAND TOTAL COST</td>
                                <td className="p-4 text-right text-lg text-primary-blue">₹{grandTotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl items-center justify-between">
                    <div className="text-center sm:text-left">
                        <div className="text-sm text-gray-500">Target Production (Stitching Qty)</div>
                        <div className="text-xl font-bold">{targetQty} Units</div>
                    </div>
                    <div className="text-center sm:text-right">
                        <div className="text-sm text-gray-500">Est. Cost Per Unit</div>
                        <div className="text-2xl font-extrabold text-green-600 dark:text-green-400">₹{unitCost.toFixed(2)}</div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="w-full sm:w-auto"><Save size={18} className="mr-2" /> Save Batch Plan</Button>
                </div>
            </CardContent>
        </Card>
    );
};
