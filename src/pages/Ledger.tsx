import React, { useState } from 'react';
import { useExpenses, expenseService } from '../hooks/useFirestore';
import { type Expense } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export const Ledger: React.FC = () => {
    const { data: expenses, loading } = useExpenses();
    const [isAdding, setIsAdding] = useState(false);

    // New Entry State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

    const handleSave = async () => {
        if (!desc || !amount) return alert('Please fill in description and amount');

        const newExpense: Expense = {
            date,
            description: desc,
            amount: parseFloat(amount),
            category,
            type
        };

        try {
            await expenseService.add(newExpense);
            setIsAdding(false);
            setDesc('');
            setAmount('');
            setCategory('General');
        } catch (err) {
            console.error(err);
            alert('Failed to save entry');
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        if (confirm('Delete this ledger entry?')) {
            await expenseService.delete(id);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading ledger...</div>;

    const totalIncome = expenses.filter(e => e.type === 'CREDIT').reduce((acc, e) => acc + e.amount, 0);
    const totalExpense = expenses.filter(e => e.type === 'DEBIT').reduce((acc, e) => acc + e.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-primary-blue" /> General Ledger
                    </h1>
                    <p className="text-gray-500">Track miscellaneous expenses and capital deposits.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : <><Plus size={18} className="mr-2" /> New Entry</>}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-6">
                        <p className="text-gray-500 dark:text-green-300 text-sm font-medium">Total Deposits</p>
                        <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">₹{totalIncome.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                    <CardContent className="p-6">
                        <p className="text-gray-500 dark:text-red-300 text-sm font-medium">Total Expenses</p>
                        <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">₹{totalExpense.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardContent className="p-6">
                        <p className="text-gray-500 dark:text-blue-300 text-sm font-medium">Net Balance</p>
                        <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">₹{balance.toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold mb-4">New Ledger Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Type</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600">
                                <option value="DEBIT">Expense</option>
                                <option value="CREDIT">Deposit</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Amount (₹)</label>
                            <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 font-bold" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                            <input type="text" placeholder="e.g. Shop Rent" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600" />
                        </div>
                        <div className="md:col-span-1">
                            <Button onClick={handleSave} className="w-full">Save Entry</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 font-medium">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No transactions recorded yet.</td>
                                </tr>
                            )}
                            {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                                    <td className="p-4 font-medium">{entry.description}</td>
                                    <td className="p-4 text-gray-500">{entry.category}</td>
                                    <td className="p-4">
                                        {entry.type === 'CREDIT' ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded w-max">
                                                <TrendingUp size={12} /> Deposit
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded w-max">
                                                <TrendingDown size={12} /> Expense
                                            </span>
                                        )}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};
export default Ledger;
