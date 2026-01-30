/**
 * Importa candidatos do CSV (assets/candidates/candidates.csv) para o Supabase.
 * Aplica normalização (cidade, fonte, áreas de interesse, filhos, foto Drive) antes de inserir.
 *
 * Uso: node scripts/import-candidates-from-csv.js
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL, SUPABASE_ANON_KEY)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { normalizeCity } from '../src/utils/cityNormalizer.js';
import { normalizeSource } from '../src/utils/sourceNormalizer.js';
import { normalizeInterestAreasString } from '../src/utils/interestAreaNormalizer.js';
import { normalizeChildrenForStorage } from '../src/utils/childrenNormalizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(PROJECT_ROOT, 'assets', 'candidates', 'candidates.csv');

const normalizers = { normalizeCity, normalizeSource, normalizeInterestAreasString, normalizeChildrenForStorage };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Mapa: cabeçalho CSV (exato) -> coluna DB (snake_case)
const CSV_TO_DB = {
  'Carimbo de data/hora': 'original_timestamp',
  'COD': null, // ignorar ou external_id se existir
  'Nome completo:': 'full_name',
  'Nos envie uma foto atual que você goste:': 'photo_url',
  'Data de Nascimento:': 'birth_date',
  'Idade': 'age',
  'E-mail principal:': 'email',
  'Nº telefone celular / Whatsapp:': 'phone',
  'Cidade onde reside:': 'city',
  'Áreas de interesse profissional': 'interest_areas',
  'Formação:': 'education',
  'Experiências anteriores:': 'experience',
  'Cursos e certificações profissionais.': 'courses',
  'Campo Livre, SEJA VOCÊ!': 'free_field',
  'Nível de escolaridade:': 'schooling_level',
  'Estado civil:': 'marital_status',
  'Você possui CNH tipo B?': 'has_license',
  'Instituição de ensino:': 'institution',
  'Onde você nos encontrou?': 'source',
  'Você está se candidatando a uma vaga específica ou apenas quer se inscrever no banco de talentos?': 'type_of_app',
  'Referências profissionais:': 'professional_references',
  'Certificações profissionais:': 'certifications',
  'Anexar currículo:': 'cv_url',
  'Portfólio de trabalho:': 'portfolio_url',
  'Data de formatura:': 'graduation_date',
  'Teria disponibilidade para mudança de cidade?': 'can_relocate',
  'Em caso de curso superior, está cursando neste momento?': 'is_studying',
  'Qual seria sua expectativa salarial?': 'salary_expectation',
  'Endereço de e-mail': 'email_secondary',
  'Se tem filhos, quantos?': 'children_count',
  'Você foi indicado por algum colaborador da Young? Se sim, quem?': 'referral',
  'Cópia de data': null,
  'Não quer ser contatado': null
};

function toDbRow(record, normalizers) {
  const row = {};
  for (const [csvHeader, dbCol] of Object.entries(CSV_TO_DB)) {
    if (!dbCol) continue;
    let value = record[csvHeader];
    if (value !== undefined && value !== null) value = String(value).trim();
    if (value === '') value = null;

    if (value == null) {
      row[dbCol] = null;
      continue;
    }

    switch (dbCol) {
      case 'city':
        row[dbCol] = normalizers.normalizeCity(value) || value;
        break;
      case 'source':
        row[dbCol] = normalizers.normalizeSource(value) || value;
        break;
      case 'interest_areas':
        row[dbCol] = normalizers.normalizeInterestAreasString(value) || value;
        break;
      case 'children_count': {
        const n = normalizers.normalizeChildrenForStorage(value);
        row[dbCol] = n != null ? String(n) : null;
        break;
      }
      case 'photo_url':
        row[dbCol] = driveLinkToDirect(value);
        break;
      case 'original_timestamp':
        row[dbCol] = parseTimestamp(value);
        break;
      case 'birth_date':
      case 'graduation_date':
        row[dbCol] = parseDate(value);
        break;
      case 'age':
        row[dbCol] = parseInteger(value);
        break;
      default:
        row[dbCol] = value;
    }
  }
  row.status = row.status || 'Inscrito';
  row.origin = row.origin || 'csv_import';
  row.created_by = row.created_by || 'Importação CSV';
  return row;
}

function driveLinkToDirect(url) {
  if (!url || typeof url !== 'string') return url;
  const m = url.match(/drive\.google\.com\/open\?id=([^&\s]+)/i) || url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
}

function parseTimestamp(str) {
  if (!str) return null;
  const d = parseDDMMYYYYHHMM(str);
  return d ? d.toISOString() : null;
}

function parseDate(str) {
  if (!str) return null;
  const d = parseDDMMYYYY(str);
  return d ? d.toISOString().slice(0, 10) : null;
}

function parseDDMMYYYY(str) {
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseDDMMYYYYHHMM(str) {
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const h = parseInt(m[4], 10);
    const min = parseInt(m[5], 10);
    const d = new Date(year, month, day, h, min);
    if (!isNaN(d.getTime())) return d;
  }
  return parseDDMMYYYY(s);
}

function parseInteger(str) {
  if (str == null || str === '') return null;
  const n = parseInt(String(str).replace(/,/, '.'), 10);
  return isNaN(n) ? null : n;
}

function readCsvRows() {
  return new Promise((resolve, reject) => {
    const rows = [];
    const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
    parser.on('readable', function () {
      let r;
      while ((r = parser.read()) !== null) rows.push(r);
    });
    parser.on('error', reject);
    parser.on('end', () => resolve(rows));
    const stream = fs.createReadStream(CSV_PATH);
    stream.on('error', reject);
    stream.pipe(parser);
  });
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_URL e SUPABASE_ANON_KEY).');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error('Arquivo não encontrado:', CSV_PATH);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Lendo CSV...');
  const records = await readCsvRows();
  console.log('Linhas lidas:', records.length);

  const BATCH = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const rows = chunk
      .map(r => toDbRow(r, normalizers))
      .filter(r => r.email);
    if (rows.length === 0) continue;
    const { error } = await supabase.from('candidates').insert(rows);
    if (error) {
      if (error.code === '23505') {
        for (const row of rows) {
          const { error: oneErr } = await supabase.from('candidates').insert([row]);
          if (oneErr && oneErr.code === '23505') {
            console.warn('Skip (email duplicado):', row.email);
            skipped++;
          } else if (oneErr) {
            console.warn('Skip:', row.email, oneErr.message);
            skipped++;
          } else inserted++;
        }
      } else {
        console.error('Erro no lote:', error.message);
        skipped += rows.length;
      }
    } else {
      inserted += rows.length;
    }
    if ((i + BATCH) % 500 === 0 || i + BATCH >= records.length) {
      console.log('Processados', Math.min(i + BATCH, records.length), '/', records.length);
    }
  }

  console.log('Concluído. Inseridos/atualizados:', inserted, 'Ignorados/erro:', skipped);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
