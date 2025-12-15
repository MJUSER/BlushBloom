import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Batch, type Sale, type Expense } from '../types';

// Generic Hook for Real-time Collection
function useCollection<T>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, collectionName));
        // You can add orderBy here if fields exist on all docs, careful with indexes

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(items);
            setLoading(false);
        });

        return unsubscribe;
    }, [collectionName]);

    return { data, loading };
}

// Specific Hooks
export const useBatches = () => useCollection<Batch>('batches');
export const useSales = () => useCollection<Sale>('sales');
export const useExpenses = () => useCollection<Expense>('expenses');

// CRUD Operations
export const batchService = {
    add: async (batch: Batch) => addDoc(collection(db, 'batches'), batch),
    update: async (id: string, data: Partial<Batch>) => updateDoc(doc(db, 'batches', id), data),
    delete: async (id: string) => deleteDoc(doc(db, 'batches', id))
};

export const saleService = {
    add: async (sale: Sale) => addDoc(collection(db, 'sales'), sale),
    update: async (id: string, data: Partial<Sale>) => updateDoc(doc(db, 'sales', id), data),
    delete: async (id: string) => deleteDoc(doc(db, 'sales', id))
};

export const expenseService = {
    add: async (expense: Expense) => addDoc(collection(db, 'expenses'), expense),
    update: async (id: string, data: Partial<Expense>) => updateDoc(doc(db, 'expenses', id), data),
    delete: async (id: string) => deleteDoc(doc(db, 'expenses', id))
};
