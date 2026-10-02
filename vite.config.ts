import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// host: true permite abrir no celular pela rede local (http://SEU-IP:5173)
export default defineConfig({ plugins: [react()], server: { host: true } });
