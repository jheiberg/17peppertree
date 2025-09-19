/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#8B4513',
        'secondary': '#D2B48C',
        'accent': '#CD853F',
        'warm-white': '#FAF7F2',
        'cream': '#F5F2E8',
        'gold': '#DAA520',
        'dark-brown': '#654321',
        'text-color': '#4A4A4A',
        'light-gray': '#F8F8F8',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(139, 69, 19, 0.8), rgba(205, 133, 63, 0.6))',
        'button-gradient': 'linear-gradient(135deg, #DAA520, #CD853F)',
        'form-gradient': 'linear-gradient(135deg, rgba(245, 242, 232, 0.95) 0%, rgba(250, 247, 242, 0.9) 25%, rgba(210, 180, 140, 0.15) 50%, rgba(205, 133, 63, 0.1) 75%, #F5F2E8 100%)',
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'brown': '0 15px 35px rgba(139, 69, 19, 0.15)',
        'gold': '0 10px 25px rgba(218, 165, 32, 0.3)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'fade-in-up': 'fadeInUp 0.3s ease forwards',
        'pulse-soft': 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
}