import Dexie, { type Table } from 'dexie';

// Interfaces
export interface Batch {
    id?: number;
    name: string;
    targetQty: number;
    grandTotal: number;
    unitCost: number;
    inputs: Record<string, number>; // Stores the calculator inputs (p_mat, q_mat etc.)

    // New Fields v2
    marginPerUnit?: number;
    sellingPrice?: number;

    // E-com Fields
    publicName?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
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

    // New Fields v2
    discount?: number;     // Amount deducted
    courier?: string;      // "DTDC", "SpeedPost"
    trackingNumber?: string;
}

export interface Expense {
    id?: number;
    date: string;
    description: string;
    amount: number;
    category: 'Material' | 'Equipment' | 'Marketing' | 'Other';
    type: 'CREDIT' | 'DEBIT'; // CREDIT = Deposit, DEBIT = Expense
}

export class BusinessTrackerDB extends Dexie {
    batches!: Table<Batch>;
    sales!: Table<Sale>;
    expenses!: Table<Expense>;

    constructor() {
        super('BusinessTrackerDB');
        this.version(1).stores({
            batches: '++id, name',
            sales: '++id, batchId, custName, date, status'
        });

        // Version 2: Add expenses table and indexes for new fields
        this.version(2).stores({
            batches: '++id, name, category, isPublic',
            sales: '++id, batchId, custName, date, status, courier',
            expenses: '++id, date, type, category' // New table
        });
    }
}

export const db = new BusinessTrackerDB();
