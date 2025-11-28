#!/usr/bin/env node
/**
 * Create the lab-pdfs storage bucket using Supabase Storage API
 * This is needed because the SQL INSERT approach doesn't work for storage buckets
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('This is required to create storage buckets');
  process.exit(1);
}

// Extract hostname from URL
const urlMatch = SUPABASE_URL.match(/https:\/\/([^/]+)/);
if (!urlMatch) {
  console.error('ERROR: Invalid SUPABASE_URL format');
  process.exit(1);
}
const hostname = urlMatch[1];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('Creating lab-pdfs storage bucket...\n');

  // First, check if bucket already exists
  console.log('Checking existing buckets...');
  const listResult = await makeRequest('GET', '/storage/v1/bucket');

  if (listResult.status === 200) {
    const buckets = JSON.parse(listResult.data);
    const existing = buckets.find(b => b.id === 'lab-pdfs' || b.name === 'lab-pdfs');
    if (existing) {
      console.log('✓ Bucket "lab-pdfs" already exists!');
      console.log('  ID:', existing.id);
      console.log('  Public:', existing.public);
      console.log('  File size limit:', existing.file_size_limit);
      return;
    }
  }

  // Create the bucket
  console.log('Creating bucket...');
  const createResult = await makeRequest('POST', '/storage/v1/bucket', {
    id: 'lab-pdfs',
    name: 'lab-pdfs',
    public: false,
    file_size_limit: 10485760, // 10MB
    allowed_mime_types: ['application/pdf']
  });

  if (createResult.status === 200 || createResult.status === 201) {
    console.log('✓ Bucket "lab-pdfs" created successfully!');
    console.log(createResult.data);
  } else if (createResult.status === 400 && createResult.data.includes('already exists')) {
    console.log('✓ Bucket "lab-pdfs" already exists');
  } else {
    console.error('✗ Failed to create bucket');
    console.error('Status:', createResult.status);
    console.error('Response:', createResult.data);
    process.exit(1);
  }

  console.log('\n✓ Storage bucket setup complete!');
  console.log('\nNote: RLS policies were already created via SQL migration.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
