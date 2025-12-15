import React, { useEffect, useState } from 'react';
import { type Batch, type CostComponent } from '../../types';
import { batchService } from '../../hooks/useFirestore';
import { Button } from '../ui/Button';
import { Save, X, Calculator, Globe, Plus, Trash2, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface BatchFormProps {
    onClose: () => void;
    initialData?: Batch;
}

// Legacy IDs for migration
const LEGACY_ITEMS = {
    'mat': 'Material',
    'lin': 'Lining',
    'mship': 'Material Shipping',
    'vship': 'Vendor Shipping',
    'stitch': 'Stitching',
    'pack': 'Packaging',
    'cship': 'Customer Shipment'
};

export const BatchForm: React.FC<BatchFormProps> = ({ onClose, initialData }) => {
    const [name, setName] = useState('');
    const [targetQty, setTargetQty] = useState<number | ''>(1);
    const [marginPerUnit, setMarginPerUnit] = useState<number | ''>(0);

    // E-com
    const [isPublic, setIsPublic] = useState(false);
    const [publicName, setPublicName] = useState('');
    const [description, setDescription] = useState('');

    // New Architecture
    const [costs, setCosts] = useState<CostComponent[]>([]);

    // Initialize state
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setTargetQty(initialData.targetQty);
            setMarginPerUnit(initialData.marginPerUnit || 0);
            setIsPublic(initialData.isPublic || false);
            setPublicName(initialData.publicName || initialData.name); // Default to internal name if empty
            setDescription(initialData.description || '');

            if (initialData.costs && initialData.costs.length > 0) {
                setCosts(initialData.costs);
            } else if (initialData.inputs) {
                // MIGRATE Legacy Inputs -> New Costs
                const migrated: CostComponent[] = [];
                Object.entries(LEGACY_ITEMS).forEach(([key, label]) => {
                    // legacy quantity was sometimes total usage, sometimes unit count. 
                    // We'll treat p*q as Total Fixed Cost for safety unless it's clearly per-unit (like stitching).
                    // Actually, let's just make them all FIXED totals for now to equal the old GrandTotal, 
                    // except maybe Stitching which scales.
                    // Simpler: Just make everything FIXED with Qty=1 and Rate=TotalOldCost. 
                    // That preserves the math perfectly.

                    const q = initialData.inputs![`q_${key}`] || 0;
                    const p = initialData.inputs![`p_${key}`] || 0;

                    if (p > 0 || q > 0) {
                        migrated.push({
                            id: crypto.randomUUID(),
                            name: label,
                            rate: p,
                            qty: q,
                            unit: 'units',
                            type: 'FIXED', // Defaulting to Fixed to preserve old calculation logic mostly
                        });
                    }
                });
                setCosts(migrated);
            }
        } else {
            // New Batch Defaults
            setCosts([
                { id: crypto.randomUUID(), name: 'Main Fabric', rate: 0, qty: 0, unit: 'm', type: 'FIXED' },
                { id: crypto.randomUUID(), name: 'Stitching Labor', rate: 0, qty: 1, unit: 'pc', type: 'PER_UNIT' }
            ]);
        }
    }, [initialData]);

    const addRow = () => {
        setCosts([...costs, {
            id: crypto.randomUUID(),
            name: '',
            rate: 0,
            qty: 1,
            unit: 'pcs',
            type: 'FIXED' // Default
        }]);
    };

    const removeRow = (id: string) => {
        setCosts(costs.filter(c => c.id !== id));
    };

    const updateRow = (id: string, field: keyof CostComponent, value: any) => {
        setCosts(costs.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Calculations
    const currentTargetQty = Number(targetQty) || 1;

    const calculatedCosts = costs.map(c => {
        const rate = Number(c.rate) || 0;
        const qty = Number(c.qty) || 0;
        let total = 0;

        if (c.type === 'FIXED') {
            // e.g. 100m fabric * 50rs = 5000 Total for the batch
            total = rate * qty;
        } else {
            // PER_UNIT: e.g. 10rs button * 5 buttons/dress * 100 dresses
            // BUT wait, user prompt: "Shipment per piece expecting 10".
            // So if Rate is 10, Qty is 1?
            // Let's assume Rate is CostPerItem, Qty is ItemsPerUnitProduct.
            // Total = Rate * Qty * BatchTargetQty
            total = rate * qty * currentTargetQty;
        }
        return { ...c, total, rate, qty }; // Return clean numbers
    });

    const grandTotal = calculatedCosts.reduce((acc, c) => acc + c.total, 0);
    const unitCost = grandTotal / currentTargetQty;
    const sellingPrice = unitCost + (Number(marginPerUnit) || 0);

    const handleSave = async () => {
        if (!name.trim()) return alert('Please enter a batch name');
        if (grandTotal <= 0) return alert('Total cost cannot be zero');

        const batchData: Batch = {
            name,
            targetQty: currentTargetQty,
            grandTotal,
            unitCost,
            costs: calculatedCosts, // Store the structured costs

            // Legacy inputs: clear them or keep empty to save space
            inputs: {},

            // New Fields
            marginPerUnit: Number(marginPerUnit) || 0,
            sellingPrice,
            isPublic,
            publicName,
            description
        };

        try {
            if (initialData && initialData.id) {
                await batchService.update(initialData.id, batchData);
            } else {
                await batchService.add(batchData);
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save batch.");
        }
    };

    return (
        <Card className="w-full shadow-2xl h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center bg-white dark:bg-card-dark z-10 border-b flex-shrink-0">
                <CardTitle><Calculator className="text-primary-blue" /> {initialData ? 'Edit Costing Plan' : 'New Costing Plan'}</CardTitle>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto flex-grow p-6">

                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Batch Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Summer Collection"
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-blue-600">Total Products to Make (Target Qty)</label>
                        <div className="relative">
                            <Box className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="number"
                                value={targetQty}
                                onChange={e => setTargetQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full pl-10 p-3 bg-blue-50 dark:bg-blue-900/10 border-blue-200 border rounded-xl font-bold text-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* The COST TABLE */}
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="p-3">Component / Material</th>
                                <th className="p-3 w-28">Type</th>
                                <th className="p-3 w-24">Rate (₹)</th>
                                <th className="p-3 w-24">Qty used</th>
                                <th className="p-3 w-20">Unit</th>
                                <th className="p-3 text-right w-32">Line Total</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {costs.map((item) => {
                                const calculated = calculatedCosts.find(c => c.id === item.id);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={e => updateRow(item.id, 'name', e.target.value)}
                                                placeholder="Item Name"
                                                className="w-full bg-transparent p-2 border border-transparent hover:border-gray-200 rounded focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={item.type}
                                                onChange={e => updateRow(item.id, 'type', e.target.value)}
                                                className="w-full bg-transparent p-2 rounded outline-none text-xs font-bold uppercase text-gray-600"
                                            >
                                                <option value="FIXED">Total (Bulk)</option>
                                                <option value="PER_UNIT">Per Piece</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={e => updateRow(item.id, 'rate', e.target.value)}
                                                className="w-full bg-transparent p-2 border-b border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => updateRow(item.id, 'qty', e.target.value)}
                                                className="w-full bg-transparent p-2 border-b border-gray-200 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={item.unit}
                                                onChange={e => updateRow(item.id, 'unit', e.target.value)}
                                                className="w-full bg-transparent p-2 text-gray-400 text-xs"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-mono font-medium">
                                            ₹{calculated?.total.toLocaleString()}
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeRow(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <td colSpan={7} className="p-2">
                                    <Button variant="ghost" className="w-full text-gray-500 hover:text-primary-blue border-dashed border-2 border-gray-200" onClick={addRow}>
                                        <Plus size={16} className="mr-2" /> Add Cost Component
                                    </Button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                    <div>
                        <h4 className="font-bold text-gray-500 text-sm uppercase mb-4">Cost Summary</h4>
                        <div className="flex justify-between items-center mb-2">
                            <span>Total Batch Cost</span>
                            <span className="font-bold text-lg">₹{grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span>Target Production</span>
                            <span>{currentTargetQty} units</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between items-center text-primary-blue">
                            <span className="font-bold">Cost Per Unit</span>
                            <span className="font-extrabold text-2xl">₹{unitCost.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-sm font-bold text-green-600 uppercase mb-2 block">Pricing Strategy</label>
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <span className="text-sm text-gray-600">Desired Margin / Unit</span>
                            <div className="flex items-center gap-1 w-32">
                                <span className="text-green-600 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={marginPerUnit}
                                    onChange={e => setMarginPerUnit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="w-full p-2 border-b-2 border-green-200 focus:border-green-500 outline-none font-bold text-right"
                                />
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex justify-between items-center">
                            <span className="font-bold text-green-800 dark:text-green-300">Selling Price</span>
                            <span className="font-extrabold text-2xl text-green-700 dark:text-green-400">₹{sellingPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* E-Commerce Section */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                    <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                        <Globe size={18} /> E-Commerce Settings
                    </h4>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={e => setIsPublic(e.target.checked)}
                                className="w-5 h-5 rounded text-primary-blue"
                            />
                            <div className="flex-1">
                                <div className="font-medium">Publish to Online Store</div>
                                <div className="text-xs text-gray-500">Makes this batch available for public viewing</div>
                            </div>
                        </label>

                        {isPublic && (
                            <div className="animate-in slide-in-from-top-2 space-y-3">
                                <input
                                    type="text"
                                    value={publicName}
                                    onChange={e => setPublicName(e.target.value)}
                                    placeholder="Public Display Name (e.g. Royal Silk Saree)"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
                                />
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Product description for customers..."
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border rounded-xl"
                                />
                            </div>
                        )}
                    </div>
                </div>

            </CardContent>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-slate-900">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto px-8"><Save size={18} className="mr-2" /> Save Batch</Button>
            </div>
        </Card>
    );
};
