/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // FOXP2 neural memory colors
                'foxp2-primary': '#6366f1',
                'foxp2-secondary': '#8b5cf6',
                'neural-blue': '#3b82f6',
                'memory-purple': '#a855f7',
                // Minecraft-style colors
                'minecraft': {
                    'green': '#00aa00',
                    'dark-green': '#005500',
                    'brown': '#8b4513',
                    'dirt': '#654321',
                    'stone': '#7f7f7f',
                    'cobblestone': '#5a5a5a',
                    'wood': '#deb887',
                    'grass': '#7cbd32',
                    'sky': '#87ceeb',
                },
                // Flat Minecraft colors for gradient usage
                'minecraft-green': '#00aa00',
                'minecraft-dark-green': '#005500',
                'minecraft-brown': '#8b4513',
                'minecraft-dirt': '#654321',
                'minecraft-stone': '#7f7f7f',
                'minecraft-cobblestone': '#5a5a5a',
                'minecraft-wood': '#deb887',
                'minecraft-grass': '#7cbd32',
                'minecraft-sky': '#87ceeb'
            },
            fontFamily: {
                'minecraft': ['"Press Start 2P"', 'monospace'],
            },
            fontSize: {
                'minecraft-xs': ['12px', '16px'],
                'minecraft-sm': ['14px', '18px'],
                'minecraft': ['16px', '20px'],
                'minecraft-lg': ['18px', '22px'],
                'minecraft-xl': ['20px', '24px'],
                'minecraft-2xl': ['24px', '28px'],
            },
            spacing: {
                'pixel': '1px',
                'minecraft': '8px',
            },
            borderWidth: {
                'minecraft': '2px',
                'minecraft-thick': '4px',
            }
        },
    },
    plugins: [],
}
