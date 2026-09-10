// Reescreve a tabela `name` de uma fonte SFNT (TrueType/OpenType).
//
// Existe por causa da cláusula 3 da SIL OFL: uma Modified Version não pode usar o
// Reserved Font Name da original como nome primário. Subsetar é modificar
// (OFL-FAQ 2.6), e o subset gerado aqui remove tabelas OpenType e instancia os
// eixos variáveis — não preserva a Functional Equivalence que a FAQ 2.7/2.8 exigiria
// para manter o RFN. O Merriweather declara RFN; por isso os arquivos gerados a
// partir dele são renomeados. Ver docs/design/fonts-inventory.md.
//
// O subsetter (harfbuzz) não renomeia, então a tabela é reconstruída à mão: o
// formato é simples (records de 12 bytes + pool de strings UTF-16BE), mas trocar o
// tamanho dela desloca todas as tabelas seguintes — daí o relayout completo do
// diretório com checksums recalculados.

const CHECKSUM_ADJUSTMENT_OFFSET = 8; // dentro da tabela `head`
const SFNT_MAGIC = 0xb1b0afba;

const readTableDirectory = (buffer) => {
  const numTables = buffer.readUInt16BE(4);
  const tables = [];
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    tables.push({
      tag: buffer.toString('ascii', record, record + 4),
      checksum: buffer.readUInt32BE(record + 4),
      offset: buffer.readUInt32BE(record + 8),
      length: buffer.readUInt32BE(record + 12),
    });
  }
  return tables;
};

/** Records da tabela `name`, com as strings já decodificadas. */
const parseNameTable = (table) => {
  const count = table.readUInt16BE(2);
  const stringOffset = table.readUInt16BE(4);
  const records = [];

  for (let index = 0; index < count; index += 1) {
    const record = 6 + index * 12;
    const length = table.readUInt16BE(record + 8);
    const offset = table.readUInt16BE(record + 10);
    const raw = table.subarray(stringOffset + offset, stringOffset + offset + length);
    const platformId = table.readUInt16BE(record);

    records.push({
      platformId,
      encodingId: table.readUInt16BE(record + 2),
      languageId: table.readUInt16BE(record + 4),
      nameId: table.readUInt16BE(record + 6),
      // Plataforma 3 (Windows) usa UTF-16BE; plataforma 1 (Mac) usa MacRoman, que
      // para os nomes ASCII destas fontes coincide com latin1.
      value: platformId === 3 ? raw.swap16().toString('utf16le') : raw.toString('latin1'),
    });
  }

  return records;
};

const encodeNameValue = (record) =>
  record.platformId === 3
    ? Buffer.from(record.value, 'utf16le').swap16()
    : Buffer.from(record.value, 'latin1');

const buildNameTable = (records) => {
  const encoded = records.map(encodeNameValue);
  const header = Buffer.alloc(6 + records.length * 12);
  header.writeUInt16BE(0, 0); // format 0
  header.writeUInt16BE(records.length, 2);
  header.writeUInt16BE(header.length, 4);

  let stringOffset = 0;
  records.forEach((record, index) => {
    const at = 6 + index * 12;
    header.writeUInt16BE(record.platformId, at);
    header.writeUInt16BE(record.encodingId, at + 2);
    header.writeUInt16BE(record.languageId, at + 4);
    header.writeUInt16BE(record.nameId, at + 6);
    header.writeUInt16BE(encoded[index].length, at + 8);
    header.writeUInt16BE(stringOffset, at + 10);
    stringOffset += encoded[index].length;
  });

  return Buffer.concat([header, ...encoded]);
};

const padTo4 = (length) => (length + 3) & ~3;

const checksum = (buffer) => {
  let sum = 0;
  for (let offset = 0; offset < buffer.length; offset += 4) {
    sum = (sum + buffer.readUInt32BE(offset)) >>> 0;
  }
  return sum;
};

/**
 * Reconstrói o arquivo com as tabelas na ordem original, realinhadas em 4 bytes.
 * `head.checkSumAdjustment` é zerado antes de somar o arquivo inteiro, como manda a
 * spec, e só então recebe o valor final.
 */
const rebuildSfnt = (buffer, replacements) => {
  const tables = readTableDirectory(buffer);
  const parts = tables.map((table) => {
    const original = buffer.subarray(table.offset, table.offset + table.length);
    const replacement = replacements.get(table.tag);
    const data = replacement ?? Buffer.from(original);
    const padded = Buffer.alloc(padTo4(data.length));
    data.copy(padded);
    return { tag: table.tag, data, padded };
  });

  const header = Buffer.alloc(12 + tables.length * 16);
  buffer.copy(header, 0, 0, 12);

  let offset = header.length;
  parts.forEach((part, index) => {
    const record = 12 + index * 16;
    header.write(part.tag, record, 4, 'ascii');
    header.writeUInt32BE(checksum(part.padded), record + 4);
    header.writeUInt32BE(offset, record + 8);
    header.writeUInt32BE(part.data.length, record + 12);
    offset += part.padded.length;
  });

  const output = Buffer.concat([header, ...parts.map((part) => part.padded)]);

  const headIndex = parts.findIndex((part) => part.tag === 'head');
  if (headIndex !== -1) {
    const headOffset = output.readUInt32BE(12 + headIndex * 16 + 8);
    output.writeUInt32BE(0, headOffset + CHECKSUM_ADJUSTMENT_OFFSET);
    const adjustment = (SFNT_MAGIC - checksum(output)) >>> 0;
    output.writeUInt32BE(adjustment, headOffset + CHECKSUM_ADJUSTMENT_OFFSET);
  }

  return output;
};

/**
 * Devolve uma cópia da fonte com os nameIds de `names` substituídos.
 *
 * `names` mapeia nameId → string. Um id ausente da fonte é acrescentado (usando a
 * plataforma 3/1/0x409, a única que todo browser lê); um id presente é reescrito em
 * todas as plataformas em que aparece. Os demais records passam intactos — é assim
 * que copyright (0), licença (13) e URL da licença (14) sobrevivem à renomeação,
 * como a OFL-FAQ 2.8 pede.
 */
export const renameSfnt = (buffer, names) => {
  const tables = readTableDirectory(buffer);
  const nameTable = tables.find((table) => table.tag === 'name');
  if (!nameTable) throw new Error('fonte sem tabela `name`');

  const records = parseNameTable(buffer.subarray(nameTable.offset, nameTable.offset + nameTable.length));

  for (const record of records) {
    if (Object.hasOwn(names, record.nameId)) record.value = names[record.nameId];
  }

  for (const [nameId, value] of Object.entries(names)) {
    if (records.some((record) => record.nameId === Number(nameId))) continue;
    records.push({ platformId: 3, encodingId: 1, languageId: 0x409, nameId: Number(nameId), value });
  }

  // A spec exige os records ordenados por platform/encoding/language/nameId.
  records.sort(
    (a, b) =>
      a.platformId - b.platformId ||
      a.encodingId - b.encodingId ||
      a.languageId - b.languageId ||
      a.nameId - b.nameId,
  );

  return rebuildSfnt(buffer, new Map([['name', buildNameTable(records)]]));
};

/**
 * Os nameIds da tabela `name` de uma fonte SFNT, como `{ [nameId]: valor }`.
 *
 * @param {Buffer} buffer
 * @returns {Record<number, string>}
 */
export const readSfntNames = (buffer) => {
  const tables = readTableDirectory(buffer);
  const nameTable = tables.find((table) => table.tag === 'name');
  if (!nameTable) throw new Error('fonte sem tabela `name`');

  /** @type {Record<number, string>} */
  const names = {};
  for (const record of parseNameTable(
    buffer.subarray(nameTable.offset, nameTable.offset + nameTable.length),
  )) {
    names[record.nameId] ??= record.value;
  }
  return names;
};
