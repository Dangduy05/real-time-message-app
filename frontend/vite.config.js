import {
    defineConfig
} from 'vite';

import react
    from '@vitejs/plugin-react';

import {
    fileURLToPath
} from 'node:url';

export default defineConfig({

    plugins: [react()],

    resolve: {

        alias: {
            events:
                fileURLToPath(
                    new URL(
                        './src/polyfills/events.js',
                        import.meta.url
                    )
                ),
            util:
                fileURLToPath(
                    new URL(
                        './src/polyfills/util.js',
                        import.meta.url
                    )
                )
        }

    },

    define: {
        global: 'globalThis',
        process: 'globalThis.process'
    },

    server: {

        host: '0.0.0.0',

        port: 5173,

        proxy: {

            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },

            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },

            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true
            }

        },

        hmr: {

            host: 'localhost',

            protocol: 'ws',

            port: 5173

        }

    }

});
