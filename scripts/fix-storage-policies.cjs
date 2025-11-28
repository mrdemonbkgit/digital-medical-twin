#!/usr/bin/env node
/**
 * Fix RLS policies for lab-pdfs storage bucket
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
  process.exit(1);
}

if (!PROJECT_REF) {
  console.error('ERROR: Could not determine project reference');
  process.exit(1);
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

async function main() {
  console.log('Fixing RLS policies for lab-pdfs bucket...\n');

  // First, check existing policies
  console.log('Checking existing policies...');
  try {
    const result = await runSQL(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname LIKE '%PDF%'
    `);
    console.log('Existing PDF policies:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.log('Could not fetch existing policies:', err.message);
  }

  // Drop existing policies if they exist
  console.log('\nDropping existing policies...');
  const dropPolicies = [
    'Users can upload their own PDFs',
    'Users can read their own PDFs',
    'Users can update their own PDFs',
    'Users can delete their own PDFs'
  ];

  for (const policy of dropPolicies) {
    try {
      await runSQL(`DROP POLICY IF EXISTS "${policy}" ON storage.objects`);
      console.log(`  Dropped: ${policy}`);
    } catch (err) {
      console.log(`  Skip drop ${policy}: ${err.message}`);
    }
  }

  // Create new policies
  console.log('\nCreating new policies...');

  // INSERT policy
  try {
    await runSQL(`
      CREATE POLICY "Users can upload their own PDFs"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'lab-pdfs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    `);
    console.log('  ✓ Created INSERT policy');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('  ⚠ INSERT policy already exists');
    } else {
      console.error('  ✗ INSERT policy failed:', err.message);
    }
  }

  // SELECT policy
  try {
    await runSQL(`
      CREATE POLICY "Users can read their own PDFs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'lab-pdfs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    `);
    console.log('  ✓ Created SELECT policy');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('  ⚠ SELECT policy already exists');
    } else {
      console.error('  ✗ SELECT policy failed:', err.message);
    }
  }

  // UPDATE policy
  try {
    await runSQL(`
      CREATE POLICY "Users can update their own PDFs"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'lab-pdfs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    `);
    console.log('  ✓ Created UPDATE policy');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('  ⚠ UPDATE policy already exists');
    } else {
      console.error('  ✗ UPDATE policy failed:', err.message);
    }
  }

  // DELETE policy
  try {
    await runSQL(`
      CREATE POLICY "Users can delete their own PDFs"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'lab-pdfs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    `);
    console.log('  ✓ Created DELETE policy');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('  ⚠ DELETE policy already exists');
    } else {
      console.error('  ✗ DELETE policy failed:', err.message);
    }
  }

  console.log('\n✓ RLS policies setup complete!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
