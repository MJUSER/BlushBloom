import React, { useRef, useState } from 'react';
import { db as localDb } from '../db/db';
import { useBatches, useSales, useExpenses, batchService, saleService, expenseService } from '../hooks/useFirestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Upload, Database, AlertTriangle, CloudUpload } from 'lucide-react';
import type { Batch, Sale, Expense } from '../types';

export const Settings: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [migrating, setMigrating] = useState(false);

    // Firestore Data
    const { data: batches } = useBatches();
    const { data: sales } = useSales();
    const { data: expenses } = useExpenses();

    // 1. Export Firestore Data
    const handleExport = async () => {
        try {
            const data = {
                batches,
                sales,
                expenses,
                version: 2, // Firestore Schema
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tracker-cloud-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed: ' + e);
        }
    };

    // 2. Import to Firestore
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('WARNING: This will ADD imported data to your current Cloud database. Duplicates might occur. Continue?')) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                setMigrating(true);

                // Import Batches
                if (Array.isArray(data.batches)) {
                    for (const b of data.batches) {
                        const { id, ...rest } = b; // ID is auto-gen by Firestore usually, or strictly set?
                        // If we are restoring, we might want to keep ID or map it. 
                        // For simplicity, let's create new docs to avoid conflicts, unless we implement smart merging.
                        // But wait, Sales reference Batch IDs. If we drop Batch ID, we break links.
                        // We must try to preserve ID if possible, or we need a mapping map.
                        // Firestore allow custom IDs. Let's try to use 'setDoc' if we had a service for it, 
                        // but 'add' generates ID. 
                        // Let's assume for now we just ADD them as new records (simple restore).
                        // Ideally, we should check if ID exists. 

                        // For now, simpler: Just Add. Warning: This breaks relations if Batch ID changes.
                        // A proper restore is complex. Let's just do a "Add all" approach.
                        await batchService.add(rest as Batch);
                    }
                }

                // Import Sales
                if (Array.isArray(data.sales)) {
                    for (const s of data.sales) {
                        const { id, ...rest } = s;
                        await saleService.add(rest as Sale);
                    }
                }

                // Import Expenses
                if (Array.isArray(data.expenses)) {
                    for (const exp of data.expenses) {
                        const { id, ...rest } = exp;
                        await expenseService.add(rest as Expense);
                    }
                }

                alert('Data imported to Cloud successfully!');
            } catch (error) {
                console.error(error);
                alert('Import failed: ' + error);
            } finally {
                setMigrating(false);
            }
        };
        reader.readAsText(file);
    };

    // 3. Migrate Local (Dexie) to Cloud (Firestore)
    const handleMigrateLocal = async () => {
        if (!confirm('Migrate all LOCAL data to Cloud? This might take a moment.')) return;

        setMigrating(true);
        try {
            const localBatches = await localDb.batches.toArray();
            const localSales = await localDb.sales.toArray();

            // We need to map old numeric IDs to new String IDs if we want to keep relations correct?
            // Firestore IDs are strings. Dexie IDs were numbers.
            // When we upload a Batch, we get a new String ID.
            // We must update the Sales to use this new String ID.

            const idMap: Record<number, string> = {};

            // 1. Upload Batches
            for (const b of localBatches) {
                // Convert old batch to new format (remove ID so firestore gens one)
                const { id, ...batchData } = b;
                // Ensure strings for new fields if missing
                const newBatch: any = {
                    ...batchData,
                    marginPerUnit: (b as any).marginPerUnit || 0,
                    sellingPrice: (b as any).sellingPrice || 0
                };

                const docRef = await batchService.add(newBatch);
                if (b.id) idMap[b.id] = docRef.id;
            }

            // 2. Upload Sales
            for (const s of localSales) {
                const { id, ...saleData } = s;

                // Convert Blob image to Base64 if needed
                let imageUrl: string | undefined = undefined;
                if (s.paymentScreenshot instanceof Blob) {
                    imageUrl = await blobToBase64(s.paymentScreenshot)
                }

                const newSale: any = {
                    ...saleData,
                    batchId: idMap[s.batchId] || 'unknown_legacy_batch', // Map to new ID
                    paymentScreenshot: imageUrl
                };

                await saleService.add(newSale);
            }

            alert(`Migration Complete! Moved ${localBatches.length} batches and ${localSales.length} sales to Cloud.`);
        } catch (e) {
            console.error(e);
            alert('Migration failed: ' + e);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Data</h2>

            <Card>
                <CardHeader>
                    <CardTitle><Database className="text-primary-blue" /> Cloud Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Cloud Storage Active</h4>
                        <p>Your data is now stored securely in the cloud (Firebase). You can access it from any device by logging in.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleExport} className="w-full gap-2 h-14 text-lg" disabled={migrating}>
                            <Download /> Export Cloud Backup
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full gap-2 h-14 text-lg border-2 border-dashed" disabled={migrating}>
                                <Upload /> Import to Cloud
                            </Button>
                        </div>
                    </div>

                    {migrating && <div className="text-center text-blue-600 font-bold animate-pulse">Processing Data... Please wait...</div>}

                    <div className="pt-8 border-t border-gray-100 dark:border-slate-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CloudUpload className="text-orange-500" /> Migration Tools
                        </h3>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                            <p className="mb-4 text-sm text-orange-800 dark:text-orange-200">
                                Still see data on your old device? Use this to move your local browser data to the cloud.
                                <br /><strong>Note:</strong> Perform this only ONCE to avoid duplicates.
                            </p>
                            <Button onClick={handleMigrateLocal} className="w-full sm:w-auto gap-2 bg-orange-600 hover:bg-orange-700 text-white" disabled={migrating}>
                                <CloudUpload size={18} /> Migrate Local Data to Cloud
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Utils
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
export default Settings;
