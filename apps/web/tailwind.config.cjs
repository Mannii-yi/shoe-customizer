/** @type {import('tailwindcss').Config} */
// tailwind.config.cjs: Dev B's theme merged into the existing CJS config (the repo uses .cjs, so do NOT add a second tailwind.config.js).
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { bg:'var(--color-bg)', surface:'var(--color-surface)', ink:'var(--color-ink)', muted:'var(--color-muted)', line:'var(--color-border)',
        coral:'var(--color-coral)', blue:'var(--color-blue)', lime:'var(--color-lime)', pink:'var(--color-pink)', danger:'var(--color-danger)', success:'var(--color-success)' },
      fontFamily: { display:['var(--font-display)'], sans:['var(--font-sans)'] },
      borderRadius: { sm:'var(--radius-sm)', md:'var(--radius-md)', lg:'var(--radius-lg)' },
      boxShadow: { card:'var(--shadow-card)', lift:'var(--shadow-lift)', ring:'var(--focus-ring)' },
      transitionTimingFunction: { out:'var(--ease-out)' },
    },
  },
  plugins: [],
};
