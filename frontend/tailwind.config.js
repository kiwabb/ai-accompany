/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'], // Nunito as general sans-serif
      },
      colors: {
        cozy: {
          cream: '#FDF7E4', // Softest background
          lightPink: '#FBF0F6', // For subtle elements
          pastelGreen: '#D4EDDA', // Short break
          pastelBlue: '#D7EBF8', // Long break
          warmOrange: '#FFB766', // CTA, accents
          softRed: '#FF6B6B', // Focus, alerts
          text: '#4A4439', // Primary dark text
          'text-light': '#8E8575', // Muted text
        },
      },
    },
  },
  plugins: [],
}
      }
    },
  },
  plugins: [],
}
