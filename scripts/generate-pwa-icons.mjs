import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../apps/web/public');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Solid #3880ff square PNG */
function png(size) {
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x++) {
    const i = 1 + x * 3;
    row[i] = 0x38;
    row[i + 1] = 0x80;
    row[i + 2] = 0xff;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, 'pwa-192.png'), png(192));
writeFileSync(join(outDir, 'pwa-512.png'), png(512));
writeFileSync(join(outDir, 'favicon.ico'), png(32));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3880ff"/>
  <path fill="#fff" d="M128 160h256c26 0 48 22 48 48v128c0 26-22 48-48 48H240l-64 64v-64h-48c-26 0-48-22-48-48V208c0-26 22-48 48-48z"/>
</svg>`;
writeFileSync(join(outDir, 'favicon.svg'), svg);
console.log('PWA icons written to apps/web/public');
