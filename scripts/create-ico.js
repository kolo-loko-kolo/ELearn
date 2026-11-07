const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIco() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [16, 32, 48, 64, 128, 256];
  const images = [];

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    images.push({ size, data: pngBuffer });
  }

  // Build ICO header
  const numImages = images.length;
  const headerLength = 6 + 16 * numImages;

  let currentOffset = headerLength;
  const entries = [];

  for (const img of images) {
    const width = img.size >= 256 ? 0 : img.size;
    const height = img.size >= 256 ? 0 : img.size;
    const sizeInBytes = img.data.length;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(width, 0);          // Width
    entry.writeUInt8(height, 1);         // Height
    entry.writeUInt8(0, 2);              // Color count
    entry.writeUInt8(0, 3);              // Reserved
    entry.writeUInt16LE(1, 4);           // Color planes
    entry.writeUInt16LE(32, 6);          // Bits per pixel
    entry.writeUInt32LE(sizeInBytes, 8); // Size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset

    entries.push(entry);
    currentOffset += sizeInBytes;
  }

  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // Reserved
  iconDir.writeUInt16LE(1, 2); // Type 1 = ICO
  iconDir.writeUInt16LE(numImages, 4); // Number of images

  const icoBuffer = Buffer.concat([
    iconDir,
    ...entries,
    ...images.map(img => img.data)
  ]);

  // Write to public/favicon.ico and ELearn.ico
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '../ELearn.ico'), icoBuffer);
  console.log('Successfully created multi-res ELearn.ico and public/favicon.ico!');
}

createIco().catch(console.error);
