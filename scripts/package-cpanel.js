const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'deploy');
const outputFile = path.join(outputDirectory, 'homa-cpanel.zip');
const fixedFiles = ['server.js', 'package.json', 'package-lock.json'];
const crcTable = new Uint32Array(256);

for (let n = 0; n < crcTable.length; n += 1) {
  let value = n;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[n] = value >>> 0;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function collectFiles(directory, archivePrefix) {
  if (!fs.existsSync(directory)) throw new Error(`Required directory is missing: ${archivePrefix}`);
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const archivePath = `${archivePrefix}/${entry.name}`.replaceAll('\\', '/');
    if (entry.isDirectory()) files.push(...collectFiles(absolutePath, archivePath));
    else if (entry.isFile()) files.push({ absolutePath, archivePath });
    else throw new Error(`Unsupported file type in package input: ${archivePath}`);
  }
  return files;
}

function zipEntry(file) {
  const name = Buffer.from(file.archivePath, 'utf8');
  const source = fs.readFileSync(file.absolutePath);
  const compressed = zlib.deflateRawSync(source, { level: 9 });
  const checksum = crc32(source);
  const time = new Date();
  const dosTime = (time.getHours() << 11) | (time.getMinutes() << 5) | Math.floor(time.getSeconds() / 2);
  const dosDate = ((time.getFullYear() - 1980) << 9) | ((time.getMonth() + 1) << 5) | time.getDate();

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(source.length, 22);
  local.writeUInt16LE(name.length, 26);

  return { name, source, compressed, checksum, dosTime, dosDate, local };
}

function centralEntry(entry, offset) {
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(0x0314, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(entry.dosTime, 12);
  central.writeUInt16LE(entry.dosDate, 14);
  central.writeUInt32LE(entry.checksum, 16);
  central.writeUInt32LE(entry.compressed.length, 20);
  central.writeUInt32LE(entry.source.length, 24);
  central.writeUInt16LE(entry.name.length, 28);
  central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
  central.writeUInt32LE(offset, 42);
  return Buffer.concat([central, entry.name]);
}

function main() {
  const files = fixedFiles.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new Error(`Required package file is missing: ${relativePath}`);
    }
    return { absolutePath, archivePath: relativePath };
  });
  files.push(...collectFiles(path.join(root, 'backend', 'src'), 'backend/src'));
  files.push(...collectFiles(path.join(root, 'frontend', 'dist'), 'frontend/dist'));

  const forbidden = files.filter(({ archivePath }) =>
    /(^|\/)(?:\.env(?:\..*)?|node_modules)(?:\/|$)/i.test(archivePath));
  if (forbidden.length) {
    throw new Error(`Forbidden files found in package input: ${forbidden.map((item) => item.archivePath).join(', ')}`);
  }

  const entries = files.map(zipEntry);
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const entry of entries) {
    const localPart = Buffer.concat([entry.local, entry.name, entry.compressed]);
    localParts.push(localPart);
    centralParts.push(centralEntry(entry, localOffset));
    localOffset += localPart.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputFile, Buffer.concat([...localParts, centralDirectory, end]));

  const names = entries.map(({ name }) => name.toString('utf8'));
  console.log(`Created ${path.relative(root, outputFile)} (${fs.statSync(outputFile).size} bytes)`);
  console.log(`Included ${names.length} files:`);
  for (const name of names) console.log(`- ${name}`);
}

try {
  main();
} catch (error) {
  console.error(`cPanel package failed: ${error.message}`);
  process.exitCode = 1;
}
