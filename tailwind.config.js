const animate = require("tailwindcss-animate")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
	],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: 0
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			field: '12px',
  			card: '14px',
  			pill: '9999px'
  		},
  		boxShadow: {
  			card: '0px 4px 12px rgba(17, 24, 39, 0.04)',
  			popover: '0px 8px 24px rgba(17, 24, 39, 0.08)',
  			modal: '0px 16px 48px rgba(17, 24, 39, 0.12)'
  		},
  		fontFamily: {
  			sans: ['Barlow', 'system-ui', 'sans-serif']
  		},
  		colors: {
  			brand: {
  				primary: '#2d9cdb',
  				'primary-soft': 'rgba(45, 156, 219, 0.12)',
  				'primary-hover': '#2589c5',
  				accent: '#00b074',
  				'accent-soft': 'rgba(0, 176, 116, 0.15)'
  			},
  			ink: {
  				900: '#212121',
  				700: '#464255',
  				500: '#969ba0',
  				300: '#b9babd'
  			},
  			surface: {
  				base: '#f3f2f7',
  				card: '#ffffff',
  				muted: '#f5f5f5',
  				border: '#dbdbdb'
  			},
  			danger: {
  				DEFAULT: '#dc2626',
  				soft: 'rgba(239, 68, 68, 0.1)'
  			}
  		}
  	}
  },
  plugins: [animate, require("tailwindcss-animate")],
}