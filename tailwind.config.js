/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#001f3f',
        'status-success': '#22c55e',
        'status-pending': '#3b82f6',
        'status-timeout': '#f97316',
        'status-failure': '#ef4444',
        'status-link-down': '#991b1b',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
