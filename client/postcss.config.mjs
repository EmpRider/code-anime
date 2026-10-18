/** PostCSS config for Tailwind CSS v4.
 * Called by Vite's CSS pipeline when processing client/src/index.css and @xyflow/react/dist/style.css.
 * Replaces the deleted postcss.config.js which used ESM syntax in a CJS context (build error).
 * No existing file serves this purpose — Vite requires either .mjs or "type":"module" package.json.
 * User instruction: "re write the FE part with react... dont make sorce file as god object" */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};