/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {},
  plugins: [
    require('daisyui'),
    require('tailwind-scrollbar')({ preferredStrategy: 'pseudoelements' }),
    require('@tailwindcss/typography'),
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#4e80ee',
          secondary: '#34d399',
          accent: '#f59e0b',
          neutral: '#eaecf0',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f2f4f7',
          'base-content': '#394150',
          info: '#bfdbfe',
          success: '#bbf7d0',
          warning: '#fef3c7',
          error: '#fecaca',
        },
      },
    ],
  },
};
