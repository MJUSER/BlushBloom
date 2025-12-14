import Dexie, { type Table } from 'dexie';

// Interfaces
export interface Batch {
    id?: number;
    name: string;
    targetQty: number;
    grandTotal: number;
    unitCost: number;
    inputs: Record<string, number>; // Stores the calculator inputs (p_mat, q_mat etc.)
}

export interface Sale {
    id?: number;
    batchId: number;
    date: string; // ISO Date string YYYY-MM-DD
    custName: string;
    custPhone?: string;
    custDetail?: string; // Address/Notes
    shipOrderId?: string;
    status: 'New' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    qty: number;
    price: number;
    profit: number;
    paymentScreenshot?: Blob; // Image attachment
}

export class BusinessTrackerDB extends Dexie {
    batches!: Table<Batch>;
    sales!: Table<Sale>;

    constructor() {
        super('BusinessTrackerDB');
        this.version(1).stores({
            batches: '++id, name',
            sales: '++id, batchId, custName, date, status'
        });
        // Version 2: Add paymentScreenshot to sales if we need to migrate later, 
        // but for now, we can just start with it. Dexie is flexible.
    }
}

export const db = new BusinessTrackerDB();
