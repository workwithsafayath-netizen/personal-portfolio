// Tailwind v4 is CSS-first: no tailwind.config file exists, theming lives
// in src/index.css via custom properties. This PostCSS entry is the v4 way.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
