import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { DollarSign, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

export const Dashboard: React.FC = () => {
    const sales = useLiveQuery(() => db.sales.toArray());
    const batches = useLiveQuery(() => db.batches.toArray());

    // --- STATS CALCULATION ---
    const totalRev = sales?.reduce((acc, s) => acc + s.price, 0) || 0;
    const totalProfit = sales?.reduce((acc, s) => acc + s.profit, 0) || 0;
    const totalSalesCount = sales?.length || 0;

    // Calculate potential value of unsold inventory
    let unsoldValue = 0;
    batches?.forEach(b => {
        const soldQty = sales?.filter(s => s.batchId === b.id).reduce((acc, s) => acc + s.qty, 0) || 0;
        const remaining = b.targetQty - soldQty;
        if (remaining > 0) unsoldValue += remaining * b.unitCost;
    });

    // --- CHART DATA PREP ---
    // Last 7 days sales trend
    const trendData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const daySales = sales?.filter(s => isSameDay(new Date(s.date), d)) || [];
        return {
            date: format(d, 'MMM dd'),
            revenue: daySales.reduce((acc, s) => acc + s.price, 0),
            profit: daySales.reduce((acc, s) => acc + s.profit, 0)
        };
    });

    // Product Performance (Profit by Batch)
    const batchPerformance = batches?.map(b => {
        const batchSales = sales?.filter(s => s.batchId === b.id) || [];
        const profit = batchSales.reduce((acc, s) => acc + s.profit, 0);
        return { name: b.name, value: profit };
    }).filter(b => b.value > 0).slice(0, 5) || [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400">Overview of your performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 font-medium text-sm">Total Revenue</p>
                                <h3 className="text-3xl font-bold mt-1">₹{totalRev.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20} /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 font-medium text-sm">Realized Profit</p>
                                <h3 className="text-3xl font-bold mt-1">₹{totalProfit.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={20} /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-card-dark">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Total Orders</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{totalSalesCount}</h3>
                            </div>
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><Package size={20} /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-card-dark">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Unsold Inventory Value</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">₹{unsoldValue.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><AlertCircle size={20} /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`₹${value}`, '']}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue" />
                                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Profit" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profit by Batch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={batchPerformance}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {batchPerformance.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`₹${value}`, 'Profit']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default Dashboard;
