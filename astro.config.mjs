// @ts-check
import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
    build: {
        inlineStylesheets: 'always'
    },
    vite: {
        plugins: [yaml()],
        build: {
            cssCodeSplit: false,
            assetsInlineLimit: 100000000 // Inline all assets
        }
    }
});
