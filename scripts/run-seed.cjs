#!/usr/bin/env node
/**
 * Run Supabase seed data using the Management API
 * This bypasses IPv6 issues in WSL2 by using Supabase's REST Management API
 *
 * Usage:
 *   node scripts/run-seed.cjs [seed-file]
 *
 * Example:
 *   node scripts/run-seed.cjs supabase/seed_biomarkers.sql
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        let value = trimmed.substring(eqIndex + 1);
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Get Supabase access token from CLI config
const tokenPath = path.join(process.env.HOME || process.env.USERPROFILE, '.supabase', 'access-token');
let ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN && fs.existsSync(tokenPath)) {
  ACCESS_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();
}

// Get project ref from SUPABASE_URL
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
if (!PROJECT_REF && SUPABASE_URL) {
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match) PROJECT_REF = match[1];
}

if (!ACCESS_TOKEN) {
  console.error('ERROR: Supabase access token not found');
  console.error('');
  console.error('Please login to Supabase CLI first:');
  console.error('  npx supabase login');
  console.error('');
  console.error('Or set SUPABASE_ACCESS_TOKEN environment variable');
  process.exit(1);
}

if (!PROJECT_REF) {
  console.error('ERROR: Could not determine project reference');
  console.error('');
  console.error('Make sure SUPABASE_URL is set in your .env file');
  process.exit(1);
}

/**
 * Parse SQL into individual statements, correctly handling:
 * - $$ ... $$ blocks (functions, DO blocks)
 * - Single-line comments (--)
 * - Single-quoted strings (which may contain semicolons)
 * - Regular statements ending with ;
 */
function parseSQLStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  let inSingleQuote = false;

  while (i < sql.length) {
    // Check for single quote (track string literals)
    if (sql[i] === "'" && !inSingleQuote) {
      inSingleQuote = true;
      current += sql[i];
      i++;
      continue;
    }

    if (sql[i] === "'" && inSingleQuote) {
      // Check for escaped quote ''
      if (sql[i + 1] === "'") {
        current += "''";
        i += 2;
        continue;
      }
      inSingleQuote = false;
      current += sql[i];
      i++;
      continue;
    }

    // If we're in a string, just copy characters
    if (inSingleQuote) {
      current += sql[i];
      i++;
      continue;
    }

    // Check for $$ block start (only outside strings)
    if (sql.substring(i, i + 2) === '$$') {
      current += '$$';
      i += 2;
      // Find the closing $$
      while (i < sql.length) {
        if (sql.substring(i, i + 2) === '$$') {
          current += '$$';
          i += 2;
          break;
        }
        current += sql[i];
        i++;
      }
      continue;
    }

    // Check for single-line comment (only outside strings)
    if (sql.substring(i, i + 2) === '--') {
      // Skip to end of line, but don't add to current (remove comments)
      while (i < sql.length && sql[i] !== '\n') {
        i++;
      }
      // Add the newline to preserve whitespace
      if (i < sql.length) {
        current += '\n';
        i++;
      }
      continue;
    }

    // Check for statement end (only outside strings)
    if (sql[i] === ';') {
      current += ';';
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  // Add any remaining content
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements;
}

function runSQL(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSeed(seedFile) {
  console.log(`Running seed for project: ${PROJECT_REF}`);
  console.log(`Seed file: ${seedFile}`);
  console.log('Using Supabase Management API (IPv4 compatible)\n');

  const fullPath = path.join(__dirname, '..', seedFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Seed file not found: ${fullPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, 'utf8');
  const statements = parseSQLStatements(sql);

  console.log(`Found ${statements.length} SQL statements\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.trim().startsWith('--')) continue;

    // Show progress for long seed files
    if (statements.length > 10) {
      process.stdout.write(`\rExecuting statement ${i + 1}/${statements.length}...`);
    }

    try {
      await runSQL(stmt);
      success++;
    } catch (err) {
      // Check for "already exists" errors - these are OK
      if (err.message.includes('already exists') ||
          err.message.includes('42P07') ||
          err.message.includes('42710') ||
          err.message.includes('duplicate key')) {
        skipped++;
      } else {
        failed++;
        console.error(`\n✗ Statement ${i + 1} failed: ${err.message}`);
        console.error(`  Statement preview: ${stmt.substring(0, 100)}...`);
        throw err;
      }
    }
  }

  console.log(`\n\n✓ Seed completed!`);
  console.log(`  Executed: ${success}`);
  if (skipped > 0) console.log(`  Skipped (already exists): ${skipped}`);
}

// Get seed file from command line args or use default
const seedFile = process.argv[2] || 'supabase/seed_biomarkers.sql';

runSeed(seedFile).catch(err => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
