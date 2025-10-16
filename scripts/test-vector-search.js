/* eslint-disable no-console */
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error('Server not responding');
}

async function queryVector(q, limit = 10) {
  const url = `${BASE_URL}/api/search/candidates-vector?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  return { status: res.status, data };
}

async function fetchCandidatesByIds(ids) {
  if (!ids.length) return [];
  const url = `${BASE_URL}/api/candidates?ids=${encodeURIComponent(ids.join(','))}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(`/api/candidates failed: ${res.status}`);
  return data.data || [];
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function main() {
  console.log('⏳ Waiting for dev server at', BASE_URL);
  await waitForServer(`${BASE_URL}/api/health`).catch(()=>{});

  const queries = [
    'Senior React developer Zurich',
    'Data engineer AWS Spark',
    'Product manager fintech',
    'DevOps Kubernetes Terraform',
  ];

  for (const q of queries) {
    console.log(`\n🔎 Query: ${q}`);
    const { status, data } = await queryVector(q, 20);
    console.log('Status:', status, 'Items:', data.items?.length || 0);
    assert(status === 200, 'vector endpoint did not return 200');

    const ids = (data.items || []).map(i => i.objectID).slice(0, 10);
    console.log('Top IDs:', ids.join(', '));

    const records = await fetchCandidatesByIds(ids);
    console.log('Fetched candidates:', records.length);
    // Basic validations
    records.forEach(r => {
      assert(typeof r.firstName === 'string', 'firstName missing');
      assert(typeof r.lastName === 'string', 'lastName missing');
      assert('matchingScore' in r, 'matchingScore missing');
    });
  }

  // Stability: duplicate query should be consistent in shape
  const { data: data1 } = await queryVector('Senior React developer Zurich', 10);
  const { data: data2 } = await queryVector('Senior React developer Zurich', 10);
  assert(Array.isArray(data1.items) && Array.isArray(data2.items), 'items missing');
  console.log('\n✅ Vector search basic tests passed');
}

main().catch(err => {
  console.error('❌ Vector search tests failed:', err.message);
  process.exit(1);
});


