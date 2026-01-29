/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FFC0CB', // Pink for girls
                secondary: '#FFFFFF',
            }
        },
    },
    plugins: [],
}
