import React, { useRef } from 'react';
import { db } from '../db/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const batches = await db.batches.toArray();
            const sales = await db.sales.toArray();

            // Convert blobs to base64 for JSON export if needed, or structured cloning.
            // JSON.stringify doesn't handle Blobs. We need to convert them.
            const salesWithImages = await Promise.all(sales.map(async s => {
                if (s.paymentScreenshot) {
                    return {
                        ...s,
                        paymentScreenshot: await blobToBase64(s.paymentScreenshot)
                    };
                }
                return s;
            }));

            const data = {
                batches,
                sales: salesWithImages,
                version: 1,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tracker-backup-${formatDate(new Date())}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed: ' + e);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('WARNING: This will OVERWRITE current data. Continue?')) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                // Pre-process sales to convert Base64 back to Blobs BEFORE transaction
                // This prevents transaction commit issues with async fetch
                let restoredSales: any[] = [];
                if (data.sales) {
                    restoredSales = await Promise.all(data.sales.map(async (s: any) => {
                        if (s.paymentScreenshot && typeof s.paymentScreenshot === 'string') {
                            try {
                                const blob = await base64ToBlob(s.paymentScreenshot);
                                return { ...s, paymentScreenshot: blob };
                            } catch (e) {
                                console.error("Failed to restore image", e);
                                return { ...s, paymentScreenshot: undefined }; // Fallback
                            }
                        }
                        return s;
                    }));
                }

                await db.transaction('rw', db.batches, db.sales, async () => {
                    await db.batches.clear();
                    await db.sales.clear();

                    if (data.batches) await db.batches.bulkAdd(data.batches);
                    if (restoredSales.length > 0) await db.sales.bulkAdd(restoredSales);
                });

                alert('Data imported successfully!');
                window.location.reload();
            } catch (error) {
                alert('Import failed: ' + error);
            }
        };
        reader.readAsText(file);
    };

    const clearData = async () => {
        if (confirm('DANGER: This will delete ALL data permanently. Are you sure?')) {
            await db.batches.clear();
            await db.sales.clear();
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Data</h2>

            <Card>
                <CardHeader>
                    <CardTitle><Database className="text-primary-blue" /> Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Backup Information</h4>
                        <p>Your data is stored locally in your browser. It is recommended to export a backup regularly, especially before clearing browser data.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleExport} className="w-full gap-2 h-14 text-lg">
                            <Download /> Export Backup (.json)
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full gap-2 h-14 text-lg border-2 border-dashed">
                                <Upload /> Import Backup
                            </Button>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-slate-700">
                        <h3 className="font-bold text-red-600 mb-4">Danger Zone</h3>
                        <Button variant="danger" onClick={clearData} className="w-full sm:w-auto gap-2">
                            <Trash2 size={18} /> Clear All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Utils
function formatDate(d: Date) {
    return d.toISOString().split('T')[0];
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function base64ToBlob(base64: string): Promise<Blob> {
    const res = await fetch(base64);
    return res.blob();
}

export default Settings;
