const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate 512x512
  const p512 = path.join(__dirname, '../public/icon-512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile(p512);
  console.log('Generated icon-512.png');

  // 2. Generate 192x192
  const p192 = path.join(__dirname, '../public/icon-192.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(p192);
  console.log('Generated icon-192.png');

  // 3. Apple touch icon
  const pApple = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(pApple);
  console.log('Generated apple-touch-icon.png');

  // 4. Generate 256x256 and 64x64 PNG for ICO
  const p256 = path.join(__dirname, '../public/icon-256.png');
  await sharp(svgBuffer).resize(256, 256).png().toFile(p256);

  const p64 = path.join(__dirname, '../public/icon-64.png');
  await sharp(svgBuffer).resize(64, 64).png().toFile(p64);

  const p32 = path.join(__dirname, '../public/icon-32.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile(p32);

  console.log('All PNG icons generated successfully!');
}

generate().catch(console.error);
