export interface CostComponent {
    id: string;
    name: string;
    rate: number; // Price per unit of material
    qty: number; // Qty of material used (e.g. 100m)
    unit: string; // e.g. 'm', 'pc', 'kg'
    type: 'FIXED' | 'PER_UNIT'; // FIXED = Total for batch (e.g. Fabric), PER_UNIT = Multiplied by TargetQty (e.g. Buttons/Packaging)
}

export interface Batch {
    id?: string;
    name: string;
    targetQty: number;
    grandTotal: number;
    unitCost: number;

    // New Costing Structure
    costs?: CostComponent[];

    // Deprecated but kept for migration if needed (optional)
    inputs?: Record<string, number>;

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
    id?: string;
    batchId: string; // Changed to string to link to Batch ID
    date: string;
    custName: string;
    custPhone?: string;
    custDetail?: string;
    shipOrderId?: string;
    status: 'New' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    qty: number;
    price: number;
    profit: number;
    paymentScreenshot?: string; // Base64 string or URL (Firestore doesn't store Blobs directly efficiently)

    // New Fields v2
    discount?: number;
    courier?: string;
    trackingNumber?: string;
    custAddress?: string;
    notes?: string;
}

export interface Expense {
    id?: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'CREDIT' | 'DEBIT';
}
