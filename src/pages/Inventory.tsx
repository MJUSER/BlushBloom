import React, { useState } from 'react';
import { useBatches, useSales, batchService } from '../hooks/useFirestore';
import { type Batch } from '../types';
import { BatchForm } from '../components/inventory/BatchForm';
import { Button } from '../components/ui/Button';
import { Plus, Search, Package, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export const Inventory: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [editingBatch, setEditingBatch] = useState<Batch | undefined>(undefined);

    // Data from Firestore
    const { data: batches, loading: loadingBatches } = useBatches();
    const { data: sales, loading: loadingSales } = useSales();

    const getStock = (batchId: string | undefined, target: number) => {
        if (!batchId) return { sold: 0, remaining: target, progress: 0 };
        const batchSales = sales.filter(s => s.batchId === batchId && s.status !== 'Cancelled');
        const sold = batchSales.reduce((acc, s) => acc + s.qty, 0);
        const remaining = target - sold;
        const progress = Math.min((sold / target) * 100, 100);
        return { sold, remaining, progress };
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (confirm('Are you sure you want to delete this batch?')) {
            await batchService.delete(id);
        }
    };

    const handleEdit = (batch: Batch) => {
        setEditingBatch(batch);
        setIsFormOpen(true);
    };

    // Client-side filtering
    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loadingBatches || loadingSales) {
        return <div className="p-8 text-center">Loading inventory...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your production batches and tracking</p>
                </div>
                <Button onClick={() => { setEditingBatch(undefined); setIsFormOpen(true); }}>
                    <Plus size={20} className="mr-2" /> New Batch
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search batches..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-card-dark border border-gray-100 dark:border-border-dark rounded-xl shadow-sm focus:ring-2 focus:ring-primary-blue outline-none transition-all"
                />
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-card-dark rounded-2xl">
                        <BatchForm onClose={() => setIsFormOpen(false)} initialData={editingBatch} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches?.map(batch => {
                    const { sold, remaining, progress } = getStock(batch.id, batch.targetQty);
                    const isLowStock = remaining < (batch.targetQty * 0.2);

                    return (
                        <Card key={batch.id} className="hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-primary-blue">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-primary-blue">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{batch.name}</h3>
                                            <p className="text-sm text-gray-500">ID: {batch.id?.slice(0, 6)}...</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(batch)} className="text-gray-400 hover:text-primary-blue transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(batch.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Target</span>
                                        <span className="font-medium">{batch.targetQty}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Produced Cost</span>
                                        <span className="font-medium">₹{batch.grandTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Unit Cost</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">₹{batch.unitCost.toFixed(1)}</span>
                                    </div>

                                    {/* Stock Progress */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            <span>Sold: {sold}</span>
                                            <span className={isLowStock ? "text-red-500" : "text-green-500"}>
                                                Left: {remaining}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isLowStock ? 'bg-red-500' : 'bg-primary-blue'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {filteredBatches?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No batches found. Create your first production plan!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
