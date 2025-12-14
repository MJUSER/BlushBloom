/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563eb', // Blue-600
        'bg-default': '#f8f9fa',   // Gray-50/Slate-50 equivalent
        'bg-dark': '#0f172a',      // Slate-900
        'card-light': '#ffffff',
        'card-dark': '#1e293b',    // Slate-800
        'text-dark': '#e2e8f0',    // Slate-200
        'border-subtle': '#e5e7eb',
        'border-dark': '#334155',
      }
    },
  },
  plugins: [],
}
