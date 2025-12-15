import React, { useState } from 'react';
import { useSales, useBatches, saleService } from '../hooks/useFirestore';
import { type Sale } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Search, Trash2, Edit2, DollarSign, Image as ImageIcon, FileText, MapPin } from 'lucide-react';
import { SaleForm } from '../components/sales/SaleForm';
import { format } from 'date-fns';

export const Sales: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined);
    const [search, setSearch] = useState('');

    // Load Data
    const { data: batches } = useBatches();
    const { data: sales, loading } = useSales();

    const filteredSales = sales.filter((s) =>
        s.custName.toLowerCase().includes(search.toLowerCase()) ||
        s.status.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getBatchName = (id: string) => batches.find((b) => b.id === id)?.name || 'Unknown Batch';

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (confirm('Delete this sale record?')) {
            await saleService.delete(id);
        }
    };

    const handleEdit = (sale: Sale) => {
        setEditingSale(sale);
        setIsFormOpen(true);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading sales...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Orders</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage customer orders and payments.</p>
                </div>
                <Button onClick={() => { setEditingSale(undefined); setIsFormOpen(true); }} className="gap-2">
                    <Plus size={18} /> Record New Sale
                </Button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-card-dark rounded-2xl">
                        <SaleForm onClose={() => setIsFormOpen(false)} initialData={editingSale} />
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle><DollarSign className="text-primary-blue" /> Recent Sales</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search sales..."
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
                                <th className="p-4">Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Batch</th>
                                <th className="p-4">Qty</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Profit</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredSales.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No sales found.</td></tr>
                            )}
                            {filteredSales.map((sale) => {
                                const profitClass = sale.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                                return (
                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-gray-500">{format(new Date(sale.date), 'MMM dd, yyyy')}</td>
                                        <td className="p-4 font-medium">
                                            {sale.custName}
                                            <div className="flex gap-2 mt-1">
                                                {sale.paymentScreenshot && (
                                                    <a href={sale.paymentScreenshot} download={`receipt-${sale.custName}.png`} className="text-blue-500 hover:text-blue-700" title="Download Receipt">
                                                        <ImageIcon size={14} />
                                                    </a>
                                                )}
                                                {sale.notes && (
                                                    <span className="text-yellow-500" title={sale.notes}>
                                                        <FileText size={14} />
                                                    </span>
                                                )}
                                                {sale.custAddress && (
                                                    <span className="text-gray-400" title={sale.custAddress}>
                                                        <MapPin size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono bg-gray-100 dark:bg-slate-800 rounded px-2 py-1 fit-content w-max">
                                            {getBatchName(sale.batchId)}
                                        </td>
                                        <td className="p-4">{sale.qty}</td>
                                        <td className="p-4 font-bold">₹{sale.price.toLocaleString()}</td>
                                        <td className={`p-4 font-bold ${profitClass}`}>₹{sale.profit.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`status-badge s-${sale.status.toLowerCase()}`}>{sale.status}</span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(sale)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(sale.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors">
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

export default Sales;
