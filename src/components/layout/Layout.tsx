import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { LayoutDashboard, Package, DollarSign, Moon, Sun, Settings, Store } from 'lucide-react';

export const Layout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/sales', label: 'Sales', icon: DollarSign },
        { path: '/currentexpense', label: 'Ledger', icon: DollarSign },
        { path: '/reports', label: 'Reports', icon: LayoutDashboard },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-bg-default dark:bg-bg-dark text-gray-900 dark:text-text-dark font-sans flex flex-col md:flex-row">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-card-light dark:bg-card-dark border-r border-border-subtle dark:border-border-dark h-screen fixed top-0 left-0 z-50 shadow-lg">
                <div className="p-6 flex items-center gap-3 border-b border-border-subtle dark:border-border-dark">
                    <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center text-white">
                        <Store size={20} strokeWidth={3} />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                        Blush & Bloom
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/50'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary-blue dark:hover:text-blue-400'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-subtle dark:border-border-dark">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden h-16 bg-card-light dark:bg-card-dark border-b border-border-subtle dark:border-border-dark flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center text-white">
                        <Store size={20} strokeWidth={3} />
                    </div>
                    <h1 className="text-lg font-bold">Blush & Bloom</h1>
                </div>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-4rem)] md:min-h-screen pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto fade-in">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-card-dark border-t border-border-subtle dark:border-border-dark flex justify-around items-center z-50 pb-safe">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-blue' : 'text-gray-500 dark:text-gray-400'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

        </div>
    );
};
