import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Batch } from '../db/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Search, Trash2, Edit2, Package } from 'lucide-react';
// We'll create BatchForm later
import { BatchForm } from '../components/inventory/BatchForm';

export const Inventory: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | undefined>(undefined);
    const [search, setSearch] = useState('');

    const batches = useLiveQuery(
        () => db.batches
            .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
            .toArray()
        , [search]);

    // We also need sales to calculate remaining stock
    const sales = useLiveQuery(() => db.sales.toArray());

    const getStock = (batch: Batch) => {
        if (!sales) return batch.targetQty;
        const sold = sales
            .filter(s => s.batchId === batch.id)
            .reduce((acc, s) => acc + s.qty, 0);
        return batch.targetQty - sold;
    };

    const handleEdit = (batch: Batch) => {
        setEditingBatch(batch);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this batch? Sales history will lose cost data.')) {
            await db.batches.delete(id);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingBatch(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
                    <p className="text-gray-500 dark:text-gray-400">Track raw material costs and stock levels.</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus size={18} /> New Batch
                </Button>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <BatchForm onClose={closeForm} initialData={editingBatch} />
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle><Package className="text-primary-blue" /> Stock Overview</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search batches..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-blue outline-none transition-all"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="p-4">Batch Name</th>
                                <th className="p-4">Target Qty</th>
                                <th className="p-4">Total Cost</th>
                                <th className="p-4">Unit Cost</th>
                                <th className="p-4">Remaining</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {batches?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No batches found. Create one to get started.</td>
                                </tr>
                            )}
                            {batches?.map(batch => {
                                const remaining = getStock(batch);
                                const isLow = remaining < 5;
                                const isOut = remaining <= 0;

                                return (
                                    <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{batch.name}</td>
                                        <td className="p-4">{batch.targetQty}</td>
                                        <td className="p-4 font-mono">₹{batch.grandTotal.toLocaleString()}</td>
                                        <td className="p-4 font-mono text-gray-600 dark:text-gray-300">₹{batch.unitCost.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md font-bold text-xs ${isOut ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                isLow ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {remaining} / {batch.targetQty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(batch)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => batch.id && handleDelete(batch.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Inventory; // Default export for lazy loading if needed
