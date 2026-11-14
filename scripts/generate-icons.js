import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('public/assets/aistudio/A_Mi_Gusto___Cadastro_de_clientes__6__f02b01ff.html');
const content = fs.readFileSync(htmlPath, 'utf-8');

const match = content.match(/src="data:image\/png;base64,([^"]+)"/);
if (match) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.resolve('public/logo.png'), buffer);
  fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), buffer);
  fs.writeFileSync(path.resolve('public/pwa-192x192.png'), buffer);
  fs.writeFileSync(path.resolve('public/pwa-512x512.png'), buffer);
  fs.writeFileSync(path.resolve('public/pwa-maskable-512x512.png'), buffer);
  console.log('PNG icons written successfully!');
} else {
  console.log('No base64 logo found in html');
}

// Also create public/icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#255232"/>
  <circle cx="256" cy="256" r="210" fill="#2d633d" stroke="#6fbf84" stroke-width="8"/>
  <g transform="translate(136, 120)">
    <!-- Stylized Garlic Bulb -->
    <path d="M120 30 C120 10 115 0 120 0 C125 0 120 10 120 30 Z" stroke="#e8efe9" stroke-width="8" stroke-linecap="round"/>
    <path d="M120 35 C70 45 20 100 20 160 C20 220 60 250 120 250 C180 250 220 220 220 160 C220 100 170 45 120 35 Z" fill="#f6f8f5" stroke="#255232" stroke-width="6"/>
    <path d="M120 35 C95 70 80 120 80 165 C80 210 95 245 120 250" stroke="#d9e2da" stroke-width="6" fill="none"/>
    <path d="M120 35 C145 70 160 120 160 165 C160 210 145 245 120 250" stroke="#d9e2da" stroke-width="6" fill="none"/>
    <!-- Fresh green leaves -->
    <path d="M120 35 C110 15 85 -5 65 5 C75 25 100 35 120 35 Z" fill="#6fbf84"/>
    <path d="M120 35 C130 15 155 -5 175 5 C165 25 140 35 120 35 Z" fill="#4ea565"/>
  </g>
  <text x="256" y="440" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="44" font-weight="800" fill="#eaf3ec" text-anchor="middle" letter-spacing="2">A MI GUSTO</text>
</svg>`;

fs.writeFileSync(path.resolve('public/icon.svg'), svg, 'utf-8');
console.log('SVG icon written successfully!');
