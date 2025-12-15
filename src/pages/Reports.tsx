import React from 'react';

export const Reports: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">📊 Reports</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Advanced analytics and downloadable PDF reports (Invoices, Profit Statements) will appear here.
            </p>
        </div>
    );
};

export default Reports;
