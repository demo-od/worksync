/** @type {import('tailwindcss').Config} */
export default {
    // 🔑 Crucial: Enable class-based dark mode toggling
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        './node_modules/preline/preline.js', // 🎯 Read Preline styles
    ],
    theme: {
        extend: {},
    },
    plugins: [
        import('preline/plugin'), // ⚡ Load the Preline engine
    ],
}