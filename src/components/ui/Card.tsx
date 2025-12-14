import React from 'react';
import { cn } from './Button';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                "bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-border-subtle dark:border-border-dark overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return <div className={cn("p-6 border-b border-border-subtle dark:border-border-dark", className)} {...props}>{children}</div>;
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
    return <h3 className={cn("text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", className)} {...props}>{children}</h3>;
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return <div className={cn("p-6", className)} {...props}>{children}</div>;
};
