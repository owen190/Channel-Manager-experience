#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create minimal valid PNG programmatically
function createPNG(width, height, color) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk (image data) - simple teal background
  const pixelData = Buffer.alloc(height * (1 + width * 3));
  let idx = 0;

  for (let y = 0; y < height; y++) {
    pixelData[idx++] = 0; // filter type
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(
        Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
      );
      const radius = Math.min(width, height) / 2.2;

      if (dist < radius) {
        // Teal circle
        pixelData[idx++] = 21; // R
        pixelData[idx++] = 122; // G
        pixelData[idx++] = 110; // B
      } else {
        // Transparent area (light bg)
        pixelData[idx++] = 247; // R
        pixelData[idx++] = 245; // G
        pixelData[idx++] = 242; // B
      }
    }
  }

  // Simple zlib compression (just store uncompressed)
  const zlibData = Buffer.alloc(pixelData.length + 6);
  zlibData[0] = 0x78; // zlib header
  zlibData[1] = 0x01; // no compression
  pixelData.copy(zlibData, 2);

  // Adler-32 checksum
  let adler = 1;
  for (let i = 0; i < pixelData.length; i++) {
    adler = (adler + pixelData[i]) % 65521;
  }
  adler = ((adler >> 16) | (adler << 16)) & 0xffffffff;
  zlibData.writeUInt32BE(adler, zlibData.length - 4);

  const idatChunk = createChunk('IDAT', zlibData);

  // IEND chunk (end)
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');

  const chunkData = Buffer.concat([typeBuffer, data]);

  // CRC (simplified - just use zeros for now)
  const crc = Buffer.alloc(4);

  return Buffer.concat([length, chunkData, crc]);
}

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate simple colored PNG files using a data URI approach
function createSimplePNG(size) {
  const tealColor = '#157A6E';
  const bgColor = '#F7F5F2';

  // SVG to PNG conversion - create a simple SVG data URL
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2.5}" fill="${tealColor}"/>
      <text x="${size / 2}" y="${size / 2 + 15}" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">CC</text>
    </svg>
  `;

  return Buffer.from(svg);
}

// Use a simpler approach - just create valid minimal PNGs using canvas library if available
try {
  const Canvas = require('canvas');
  const { createCanvas } = Canvas;

  function createCanvasPNG(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#F7F5F2';
    ctx.fillRect(0, 0, size, size);

    // Teal circle
    ctx.fillStyle = '#157A6E';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // White text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CC', size / 2, size / 2);

    return canvas.toBuffer('image/png');
  }

  // Generate 192x192 and 512x512 icons
  const icon192 = createCanvasPNG(192);
  const icon512 = createCanvasPNG(512);

  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

  console.log('Icons generated successfully with canvas');
} catch (canvasError) {
  console.log(
    'Canvas not available, generating minimal PNG data directly...'
  );

  // Fallback: create minimal 1x1 PNG files
  const minimalPNG = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41,
    0x54,
    0x08,
    0x99,
    0x01,
    0x01,
    0x00,
    0x00,
    0xfe,
    0xff,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x01,
    0xe5,
    0x27,
    0xde,
    0xfc,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ]);

  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), minimalPNG);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), minimalPNG);

  console.log('Minimal icons generated');
}

console.log('Icon files created in public/icons/');
