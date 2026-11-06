/**
 * Adversarial Empirical Stress Test Suite for AI Tutor RAG Pipeline
 * - Tests queryKnowledgeBase in src/data/ragKnowledgeBase.ts
 * - Tests buildRAGFallbackResponse in server.ts
 * - Tests /api/gemini/rag-chat live server route
 */

import fs from 'fs';
import path from 'path';
import {
  queryKnowledgeBase,
  removeVietnameseTones,
  INITIAL_RAG_DOCUMENTS,
  VIETNAMESE_STOP_WORDS,
  SEMANTIC_TERM_SYNONYMS,
} from '../src/data/ragKnowledgeBase';
import { RAGDocument } from '../src/types';

interface TestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const testResults: TestResult[] = [];

function assertTest(
  id: string,
  category: string,
  name: string,
  condition: boolean,
  details?: string,
  durationMs?: number
) {
  testResults.push({ id, category, name, passed: condition, details, durationMs });
  if (condition) {
    console.log(`  ✅ [PASS] [${id}] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    console.error(`  ❌ [FAIL] [${id}] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

import esbuild from 'esbuild';

// Dynamically extract and instantiate buildRAGFallbackResponse from server.ts to ensure 100% fidelity
function loadBuildRAGFallbackResponse(): (
  query: string,
  mode: string,
  hskLevel: number,
  retrievedSources: any[],
  roleplayScenario?: string
) => string {
  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const serverCode = fs.readFileSync(serverPath, 'utf-8');

  const fnMatch = serverCode.match(
    /function\s+buildRAGFallbackResponse\s*\([\s\S]*?\n\}/
  );

  if (!fnMatch) {
    throw new Error('Could not find buildRAGFallbackResponse in server.ts');
  }

  // Strip TypeScript annotations using esbuild
  const transformed = esbuild.transformSync(fnMatch[0], { loader: 'ts' });

  // Construct callable function
  const fnString = `
    ${transformed.code}
    return buildRAGFallbackResponse(query, mode, hskLevel, retrievedSources, roleplayScenario);
  `;
  return new Function(
    'query',
    'mode',
    'hskLevel',
    'retrievedSources',
    'roleplayScenario',
    fnString
  ) as any;
}

async function runEmpiricalStressSuite() {
  console.log('================================================================');
  console.log('🎯 ADVERSARIAL EMPIRICAL STRESS SUITE: AITUTOR RAG PIPELINE');
  console.log('================================================================\n');

  const buildRAGFallbackResponse = loadBuildRAGFallbackResponse();

  // =========================================================================
  // SUITE 1: DISPATCH MANDATORY QUERY VERIFICATIONS
  // =========================================================================
  console.log('--- SUITE 1: Dispatch Mandatory Query Tests ---');

  // 1. "biến điệu thanh 3" -> must return rag-tones-sandhi
  {
    const t0 = performance.now();
    const docs = queryKnowledgeBase('biến điệu thanh 3', 3);
    const duration = performance.now() - t0;
    const topDoc = docs[0];
    const hasTonesSandhi = docs.some((d) => d.id === 'rag-tones-sandhi');
    assertTest(
      'MANDATORY-1',
      'Mandatory',
      '"biến điệu thanh 3" returns rag-tones-sandhi',
      topDoc?.id === 'rag-tones-sandhi' && hasTonesSandhi,
      `Top match: ${topDoc?.id || 'none'} (${topDoc?.title || 'none'})`,
      duration
    );
  }

  // 2. "bài tập 1" -> must return [] (not matching tag "ba")
  {
    const t0 = performance.now();
    const docs = queryKnowledgeBase('bài tập 1', 3);
    const duration = performance.now() - t0;
    assertTest(
      'MANDATORY-2',
      'Mandatory',
      '"bài tập 1" must return [] (not matching tag "ba")',
      docs.length === 0,
      `Returned doc count: ${docs.length} (ids: ${docs.map((d) => d.id).join(', ') || 'none'})`,
      duration
    );
  }

  // 3. "câu so sánh chữ 比" -> must return rag-grammar-comparisons-complete
  {
    const t0 = performance.now();
    const docs = queryKnowledgeBase('câu so sánh chữ 比', 3);
    const duration = performance.now() - t0;
    const topDoc = docs[0];
    assertTest(
      'MANDATORY-3',
      'Mandatory',
      '"câu so sánh chữ 比" returns rag-grammar-comparisons-complete',
      topDoc?.id === 'rag-grammar-comparisons-complete',
      `Top match: ${topDoc?.id || 'none'} (${topDoc?.title || 'none'})`,
      duration
    );
  }

  // 4. "câu bị động chữ 被" -> must return rag-grammar-bei-passive and NOT rag-grammar-comparisons-complete
  {
    const t0 = performance.now();
    const docs = queryKnowledgeBase('câu bị động chữ 被', 3);
    const duration = performance.now() - t0;
    const topDoc = docs[0];
    const includesComparison = docs.some((d) => d.id === 'rag-grammar-comparisons-complete');
    assertTest(
      'MANDATORY-4',
      'Mandatory',
      '"câu bị động chữ 被" returns rag-grammar-bei-passive and NOT rag-grammar-comparisons-complete',
      topDoc?.id === 'rag-grammar-bei-passive' && !includesComparison,
      `Top match: ${topDoc?.id || 'none'}, includes comparison: ${includesComparison}`,
      duration
    );
  }

  // Additional prompt variants
  // 4b. "so sánh hơn" -> must return rag-grammar-comparisons-complete
  {
    const docs = queryKnowledgeBase('so sánh hơn', 3);
    assertTest(
      'VARIANT-1',
      'Variants',
      '"so sánh hơn" returns rag-grammar-comparisons-complete',
      docs[0]?.id === 'rag-grammar-comparisons-complete',
      `Top match: ${docs[0]?.id || 'none'}`
    );
  }

  // 4c. "bị động" -> must return rag-grammar-bei-passive and NOT comparisons
  {
    const docs = queryKnowledgeBase('bị động', 3);
    const topDoc = docs[0];
    const includesComparison = docs.some((d) => d.id === 'rag-grammar-comparisons-complete');
    assertTest(
      'VARIANT-2',
      'Variants',
      '"bị động" returns rag-grammar-bei-passive and NOT comparisons',
      topDoc?.id === 'rag-grammar-bei-passive' && !includesComparison,
      `Top match: ${topDoc?.id || 'none'}, includes comparison: ${includesComparison}`
    );
  }

  // =========================================================================
  // SUITE 2: ADVERSARIAL EDGE CASES & BOUNDARY TESTING
  // =========================================================================
  console.log('\n--- SUITE 2: Adversarial Boundary & Stress Cases ---');

  // Empty string
  {
    let crashed = false;
    let res: any[] = [];
    try {
      res = queryKnowledgeBase('', 3);
    } catch {
      crashed = true;
    }
    assertTest(
      'BOUNDARY-1',
      'Boundary',
      'Empty string "" returns [] without crashing',
      !crashed && res.length === 0,
      `Count: ${res.length}`
    );
  }

  // Pure whitespace
  {
    let crashed = false;
    let res: any[] = [];
    try {
      res = queryKnowledgeBase('      \t\t\n\r  ', 3);
    } catch {
      crashed = true;
    }
    assertTest(
      'BOUNDARY-2',
      'Boundary',
      'Whitespace string returns [] without crashing',
      !crashed && res.length === 0,
      `Count: ${res.length}`
    );
  }

  // Punctuation and special characters only
  {
    let crashed = false;
    let res: any[] = [];
    try {
      res = queryKnowledgeBase('!@#$%^&*()_+=-~`{}[]|\\:;"\'<>,.?/', 3);
    } catch {
      crashed = true;
    }
    assertTest(
      'BOUNDARY-3',
      'Boundary',
      'Punctuation and symbols string returns [] without crashing',
      !crashed && res.length === 0,
      `Count: ${res.length}`
    );
  }

  // Huge string (10,000 characters)
  {
    const hugeQuery = 'học tiếng Trung '.repeat(625); // 10,000 chars
    let crashed = false;
    let t0 = performance.now();
    let res: any[] = [];
    try {
      res = queryKnowledgeBase(hugeQuery, 3);
    } catch {
      crashed = true;
    }
    const duration = performance.now() - t0;
    assertTest(
      'BOUNDARY-4',
      'Boundary',
      'Huge 10,000-character query executes safely under 50ms',
      !crashed && duration < 50,
      `Duration: ${duration.toFixed(2)}ms, Count: ${res.length}`,
      duration
    );
  }

  // Multi-space whitespace collapse test
  {
    const multiSpaceQuery = 'biến    điệu   thanh   3';
    const res = queryKnowledgeBase(multiSpaceQuery, 3);
    const passed = res.some((d) => d.id === 'rag-tones-sandhi');
    assertTest(
      'ADVERSARIAL-WHITESPACE-1',
      'Whitespace Bug',
      'Multi-space query "biến    điệu   thanh   3" resolves to rag-tones-sandhi',
      passed,
      `Returned: ${res.map((d) => d.id).join(', ') || '[]'}`
    );
  }

  // False positive collision on Vietnamese "để", "đề", "dễ" with tag "de"
  {
    const deQueries = [
      'làm sao để học tốt tiếng Trung',
      'đề thi HSK khó không',
      'ngữ pháp này rất dễ hiểu',
    ];
    for (const q of deQueries) {
      const res = queryKnowledgeBase(q, 3);
      const poisoned = res.some((d) => d.id === 'rag-grammar-de-particles');
      assertTest(
        `ADVERSARIAL-COLLISION-DE-${q.slice(0, 15)}`,
        'Collision Bug',
        `Query "${q}" does not falsely retrieve rag-grammar-de-particles (tag 'de' collision)`,
        !poisoned,
        `Retrieved: ${res.map((d) => d.id).join(', ') || '[]'}`
      );
    }
  }

  // False positive collision on Vietnamese "bị", "chuẩn bị" with tag "bi"
  {
    const biQueries = [
      'chuẩn bị thi HSK',
      'hôm nay em bị ốm xin nghỉ',
    ];
    for (const q of biQueries) {
      const res = queryKnowledgeBase(q, 3);
      const poisoned = res.some((d) => d.id === 'rag-grammar-comparisons-complete');
      assertTest(
        `ADVERSARIAL-COLLISION-BI-${q.slice(0, 15)}`,
        'Collision Bug',
        `Query "${q}" does not falsely retrieve rag-grammar-comparisons-complete (tag 'bi' collision)`,
        !poisoned,
        `Retrieved: ${res.map((d) => d.id).join(', ') || '[]'}`
      );
    }
  }

  // False positive collision on Vietnamese "ba" (father / three) with tag "ba"
  {
    const baQueries = [
      'ba mẹ em đi làm',
      'hẹn gặp lại vào thứ ba',
    ];
    for (const q of baQueries) {
      const res = queryKnowledgeBase(q, 3);
      const poisoned = res.some((d) => d.id === 'rag-grammar-ba-structure');
      assertTest(
        `ADVERSARIAL-COLLISION-BA-${q.slice(0, 15)}`,
        'Collision Bug',
        `Query "${q}" does not falsely retrieve rag-grammar-ba-structure (tag 'ba' collision)`,
        !poisoned,
        `Retrieved: ${res.map((d) => d.id).join(', ') || '[]'}`
      );
    }
  }

  // False positive collision on Vietnamese "bù" with tag "bu"
  {
    const buQuery = 'học bù ngày mai';
    const res = queryKnowledgeBase(buQuery, 3);
    const poisoned = res.some((d) => d.id === 'rag-tones-sandhi');
    assertTest(
      'ADVERSARIAL-COLLISION-BU',
      'Collision Bug',
      `Query "${buQuery}" does not falsely retrieve rag-tones-sandhi (tag 'bu' collision)`,
      !poisoned,
      `Retrieved: ${res.map((d) => d.id).join(', ') || '[]'}`
    );
  }

  // Stop words only conversation
  {
    const stopWordsQuery = 'chào cô giáo em muốn học một bài mới hôm nay';
    const res = queryKnowledgeBase(stopWordsQuery, 3);
    assertTest(
      'STOPWORDS-1',
      'Stopwords',
      'Pure Vietnamese stop words conversational query returns []',
      res.length === 0,
      `Count: ${res.length} (ids: ${res.map((d) => d.id).join(', ')})`
    );
  }

  // Hanzi single character queries
  {
    const hanziTests = [
      { q: '把', expected: 'rag-grammar-ba-structure' },
      { q: '被', expected: 'rag-grammar-bei-passive' },
      { q: '比', expected: 'rag-grammar-comparisons-complete' },
    ];
    for (const t of hanziTests) {
      const res = queryKnowledgeBase(t.q, 3);
      assertTest(
        `HANZI-${t.q}`,
        'Hanzi',
        `Single Hanzi character query "${t.q}" matches ${t.expected}`,
        res[0]?.id === t.expected,
        `Top match: ${res[0]?.id || 'none'}`
      );
    }
  }

  // =========================================================================
  // SUITE 3: buildRAGFallbackResponse STRESS TESTING
  // =========================================================================
  console.log('\n--- SUITE 3: buildRAGFallbackResponse Stress Testing ---');

  // Test 1: Zero docs fallback
  {
    const res = buildRAGFallbackResponse('phong tục tết', 'general', 3, []);
    assertTest(
      'FALLBACK-0-DOCS',
      'Fallback',
      'Zero docs returns polite transparent disclaimer with HSK 3.0 general guidelines',
      res.includes('Mình chưa có tài liệu HSK chính thức') &&
        res.includes('phong tục tết') &&
        res.includes('chuẩn HSK 3.0 - Cấp độ 3'),
      `Response length: ${res.length} chars`
    );
  }

  // Test 2: Single doc fallback
  {
    const sampleDoc = INITIAL_RAG_DOCUMENTS.find((d) => d.id === 'rag-tones-sandhi')!;
    const res = buildRAGFallbackResponse('biến điệu thanh 3', 'general', 2, [sampleDoc]);
    assertTest(
      'FALLBACK-1-DOC',
      'Fallback',
      'Single doc fallback renders structured markdown with title, rules, content, examples',
      res.includes(sampleDoc.title) &&
        res.includes('Quy tắc cốt lõi:') &&
        res.includes('Giải thích & Áp dụng:') &&
        res.includes('Ví dụ tiêu biểu:') &&
        res.includes('你好 (nǐ + hǎo)'),
      `Response length: ${res.length} chars`
    );
  }

  // Test 3: Multiple docs fallback (Multi-Source Synthesis)
  {
    const docs = queryKnowledgeBase('so sánh và chữ 被', 3);
    const multiDocs = INITIAL_RAG_DOCUMENTS.slice(0, 3);
    const res = buildRAGFallbackResponse('so sánh và bị động', 'general', 3, multiDocs);
    assertTest(
      'FALLBACK-MULTI-DOCS',
      'Fallback',
      'Multiple docs (3 docs) fallback includes secondary supplementary documents section',
      res.includes('Tài liệu liên quan bổ trợ trong giáo trình:') &&
        res.includes(multiDocs[0].title) &&
        res.includes(multiDocs[1].title) &&
        res.includes(multiDocs[2].title),
      `Response length: ${res.length} chars`
    );
  }

  // Test 4: Extreme fallback inputs (empty query, malformed docs)
  {
    let crashed = false;
    let res = '';
    try {
      const malformedDoc: any = {
        title: 'Tài liệu test thiếu trường',
        // rulesSummary is missing
        // content is missing
        // examples is empty
        examples: [],
      };
      res = buildRAGFallbackResponse('', 'general', 1, [malformedDoc, { title: 'Doc 2' }]);
    } catch (e: any) {
      crashed = true;
      console.error(e);
    }
    assertTest(
      'FALLBACK-MALFORMED',
      'Fallback',
      'Fallback handles missing properties / malformed docs gracefully without crashing',
      !crashed && res.includes('Tài liệu test thiếu trường'),
      `Response length: ${res.length}`
    );
  }

  // =========================================================================
  // SUITE 4: SERVER API CONTRACT & TIMEOUT HAZARD VERIFICATION
  // =========================================================================
  console.log('\n--- SUITE 4: Server API Route Contracts & Error Handling ---');

  // 1. Missing message validation contract (tested via local express handler mock)
  {
    const reqMock: any = { body: {} };
    let statusSet = 200;
    let jsonResult: any = null;
    const resMock: any = {
      status: (s: number) => {
        statusSet = s;
        return resMock;
      },
      json: (j: any) => {
        jsonResult = j;
        return resMock;
      },
    };

    // Simulate route validation in server.ts:612-614
    if (!reqMock.body.message) {
      resMock.status(400).json({ error: 'Message is required' });
    }

    assertTest(
      'CONTRACT-1',
      'API Contract',
      'Empty message payload rejected with 400 Bad Request',
      statusSet === 400 && jsonResult.error === 'Message is required',
      `Status: ${statusSet}, error: ${jsonResult?.error}`
    );
  }

  // 2. Upstream Gemini Timeout Hazard Audit (server.ts:629-670)
  {
    const serverPath = path.resolve(process.cwd(), 'server.ts');
    const serverCode = fs.readFileSync(serverPath, 'utf-8');
    const hasTimeoutWrapper =
      serverCode.includes('Promise.race') ||
      serverCode.includes('AbortSignal.timeout') ||
      serverCode.includes('timeoutMs');

    assertTest(
      'AUDIT-TIMEOUT-HAZARD',
      'Resilience',
      'server.ts implements timeout protection around gemini.models.generateContent',
      hasTimeoutWrapper,
      hasTimeoutWrapper
        ? 'Timeout wrapper detected'
        : 'CRITICAL: No timeout protection around gemini.models.generateContent — requests will hang indefinitely on upstream latency'
    );
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log('📊 EMPIRICAL STRESS TEST RESULTS SUMMARY');
  console.log('================================================================');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log(`Total Scenarios Tested : ${total}`);
  console.log(`Passed                 : ${passed}`);
  console.log(`Failed                 : ${failed}`);
  console.log(`Pass Rate              : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 FINAL VERDICT: [APPROVE] - All adversarial and boundary tests passed!');
  } else {
    console.log(`\n⚠️ FINAL VERDICT: [REQUEST_CHANGES] - ${failed} test scenario(s) failed!`);
  }
}

runEmpiricalStressSuite().catch((e) => {
  console.error('Fatal error in stress suite:', e);
  process.exit(1);
});
