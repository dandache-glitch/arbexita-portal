/*
  Minimal ZIP builder (store/no compression) with CRC32.
  - No external dependencies.
  - Enough for creating an "inspection pack" download.
*/

type ZipFile = { name: string; data: Uint8Array };

function u16(n: number) {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number) {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concat(parts: Uint8Array[]) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// CRC32 (IEEE)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodeUtf8(s: string) {
  return new TextEncoder().encode(s);
}

function msDosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

/**
 * Create a ZIP buffer containing given files.
 * Uses "store" (no compression) for simplicity and predictability.
 */
export function createZip(files: ZipFile[], now = new Date()) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];

  let offset = 0;
  const { dosTime, dosDate } = msDosDateTime(now);

  for (const f of files) {
    const nameBytes = encodeUtf8(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    // Local file header
    const localHeader = concat([
      u32(0x04034b50), // signature
      u16(20), // version needed
      u16(0x0800), // flags (UTF-8)
      u16(0), // compression 0=store
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0), // extra length
      nameBytes,
    ]);

    localParts.push(localHeader, f.data);

    // Central directory header
    const centralHeader = concat([
      u32(0x02014b50), // signature
      u16(20), // version made by
      u16(20), // version needed
      u16(0x0800), // flags UTF-8
      u16(0), // compression
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk number
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(offset), // local header offset
      nameBytes,
    ]);

    centralParts.push(centralHeader);

    offset += localHeader.length + size;
  }

  const centralDir = concat(centralParts);
  const localData = concat(localParts);
  const centralOffset = localData.length;
  const centralSize = centralDir.length;

  const end = concat([
    u32(0x06054b50), // end signature
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralSize),
    u32(centralOffset),
    u16(0), // comment length
  ]);

  return concat([localData, centralDir, end]);
}
