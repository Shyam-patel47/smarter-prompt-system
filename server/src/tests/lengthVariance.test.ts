/**
 * Length Variance Test Suite (Point 9)
 *
 * Sends 5 genuinely varied prompts to the local /api/prompts/generate endpoint
 * and asserts that response lengths actually differ meaningfully.
 *
 * Usage: npx ts-node src/tests/lengthVariance.test.ts
 *
 * Requirements:
 *   - Server running on localhost:5000
 *   - Valid auth cookie (we'll login first)
 */

import http from 'http';

const BASE = 'http://localhost:5000';

// ─── Test prompts, ordered from trivial to maximum complexity ─────────────────

const TEST_CASES = [
  {
    label: 'TRIVIAL — tweet',
    payload: {
      taskType: 'Social Media Post',
      detailsInput: 'Tweet about a coffee sale',
      tone: 'Casual',
      outputFormat: 'Paragraphs',
      variables: [],
    },
  },
  {
    label: 'SHORT — one-sentence summary',
    payload: {
      taskType: 'Marketing Copy',
      detailsInput: 'One-sentence summary of what React hooks are',
      tone: 'Professional',
      outputFormat: 'Paragraphs',
      variables: [],
    },
  },
  {
    label: 'MEDIUM — product description',
    payload: {
      taskType: 'Marketing Copy',
      detailsInput: 'Product description for a wireless gaming mouse with RGB lighting aimed at competitive FPS gamers',
      tone: 'Persuasive',
      outputFormat: 'Paragraphs',
      variables: [],
    },
  },
  {
    label: 'LONG — full blog post',
    payload: {
      taskType: 'Blog Post',
      detailsInput: 'Write a full 2000-word blog post about the history of space exploration from Sputnik to the Mars rovers, covering key missions, technological breakthroughs, and the future of commercial spaceflight',
      tone: 'Academic',
      outputFormat: 'Paragraphs',
      variables: [],
    },
  },
  {
    label: 'MAXIMUM — exhaustive multi-section report',
    payload: {
      taskType: 'Research Summary',
      detailsInput: 'Exhaustive multi-section competitive analysis of Tesla vs BYD covering financials, battery technology roadmaps, manufacturing strategy, geographic expansion, regulatory risks, and a forward-looking investment thesis with sensitivity analysis',
      tone: 'Professional',
      outputFormat: 'Paragraphs',
      variables: [],
    },
  },
];

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  path: string,
  body: any,
  cookie?: string
): Promise<{ status: number; data: any; setCookie?: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const bodyStr = JSON.stringify(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const setCookie = res.headers['set-cookie']?.[0] || undefined;
            resolve({ status: res.statusCode || 0, data: JSON.parse(raw), setCookie });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Length Variance Test Suite ===\n');

  // Step 1: Create a test account or login
  const testEmail = `test_variance_${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  console.log(`1. Creating test account: ${testEmail}`);
  const signupRes = await makeRequest('POST', '/api/auth/signup', {
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
  });

  let cookie: string;
  if (signupRes.setCookie) {
    cookie = signupRes.setCookie.split(';')[0];
  } else {
    console.error('   Failed to signup/get cookie. Status:', signupRes.status, signupRes.data);
    process.exit(1);
  }
  console.log('   ✓ Authenticated\n');

  // Step 2: Run all test cases
  const results: { label: string; wordCount: number; charCount: number; body: string }[] = [];

  for (const tc of TEST_CASES) {
    console.log(`2. Generating: ${tc.label}...`);
    const res = await makeRequest('POST', '/api/prompts/generate', tc.payload, cookie);

    if (res.status !== 200) {
      console.error(`   ✗ Failed (${res.status}):`, res.data);
      results.push({ label: tc.label, wordCount: 0, charCount: 0, body: `ERROR: ${JSON.stringify(res.data)}` });
      continue;
    }

    const body: string = res.data.generatedBody || '';
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const charCount = body.length;
    results.push({ label: tc.label, wordCount, charCount, body });
    console.log(`   ✓ ${wordCount} words / ${charCount} chars`);
  }

  // Step 3: Print results table
  console.log('\n' + '='.repeat(80));
  console.log('LENGTH VARIANCE RESULTS');
  console.log('='.repeat(80));
  console.log(
    'Label'.padEnd(45) +
    'Words'.padStart(8) +
    'Chars'.padStart(8)
  );
  console.log('-'.repeat(61));

  const wordCounts = results.map((r) => r.wordCount).filter((w) => w > 0);

  for (const r of results) {
    console.log(
      r.label.padEnd(45) +
      String(r.wordCount).padStart(8) +
      String(r.charCount).padStart(8)
    );
  }

  console.log('-'.repeat(61));

  if (wordCounts.length >= 2) {
    const min = Math.min(...wordCounts);
    const max = Math.max(...wordCounts);
    const ratio = max / min;

    console.log(`Shortest: ${min} words`);
    console.log(`Longest:  ${max} words`);
    console.log(`Ratio:    ${ratio.toFixed(1)}x`);
    console.log(`Variance: ${ratio >= 3 ? '✓ PASS (≥3x)' : '✗ FAIL (<3x)'}`);
  }

  // Step 4: Print full prompt texts for density review (point 11 / feedback point 3)
  console.log('\n' + '='.repeat(80));
  console.log('FULL GENERATED PROMPT TEXTS (for density/redundancy review)');
  console.log('='.repeat(80));

  for (const r of results) {
    console.log(`\n--- ${r.label} (${r.wordCount} words) ---`);
    console.log(r.body);
    console.log('');
  }

  console.log('\n=== Test suite complete ===');
}

main().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
