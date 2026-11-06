/**
 * scripts/run_real_pilot_hsk1_6.ts
 *
 * Executes authentic controlled pilot generation across HSK 1–6 (3 questions per level)
 * using Groq free tier ('qwen/qwen3.8-27b') with pacing delay to avoid rate limits.
 * Writes output to artifacts/pilot/real_llm_pilot_hsk1_6.json.
 */

import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { executeHskControlledPilot } from '../src/server/pilot/hskControlledPilot.js';

async function main() {
  console.log('=== Starting Real Controlled Pilot HSK 1–6 ===');
  console.log('Target Provider: Groq Cloud (qwen/qwen3.8-27b)');
  console.log('Target Levels: HSK 1 to 6 (3 questions each = 18 total)');
  console.log('Pacing Delay: 3500ms between levels');

  const artifactPath = path.resolve(process.cwd(), 'artifacts/pilot/real_llm_pilot_hsk1_6.json');

  const report = await executeHskControlledPilot({
    mode: 'real',
    provider: 'groq',
    maxCallsAllowed: 12,
    pacingDelayMs: 3500,
    artifactPath,
  });

  console.log('=== Real Controlled Pilot Completed ===');
  console.log(`Generation Status: ${report.generationStatus}`);
  console.log(`Provider: ${report.provider}`);
  console.log(`Total Questions: ${report.totalQuestions}`);
  console.log(`LLM Calls: ${report.resources.llmCalls}/${report.resources.maxCallsAllowed}`);
  console.log(`Tokens Used: ${report.resources.tokensUsed}`);
  console.log(`Latency: ${report.resources.latencyMs}ms`);
  console.log(`Cost: $${report.resources.costUsd}`);
  console.log(`Free Tier Only: ${report.resources.isFreeTierOnly}`);
  console.log(`Summary All Passed: ${report.summary.allPassedCount}/${report.summary.totalGenerated} (${(report.summary.passRate * 100).toFixed(1)}%)`);

  const realGenCount = report.questions.filter((q) => q.attribution === 'REAL_LLM_GENERATION').length;
  const fixtureCount = report.questions.filter((q) => q.attribution === 'FALLBACK_FIXTURE').length;
  console.log(`Attribution Breakdown: REAL_LLM_GENERATION=${realGenCount}, FALLBACK_FIXTURE=${fixtureCount}`);

  for (let lvl = 1; lvl <= 6; lvl++) {
    const lvlQs = report.questions.filter((q) => q.level === lvl);
    console.log(`Level ${lvl}: ${lvlQs.length} questions [${lvlQs.map((q) => q.attribution).join(', ')}]`);
  }

  if (realGenCount > 0) {
    console.log('\nSample Real LLM Question (Level 1):');
    const sample = report.questions.find((q) => q.attribution === 'REAL_LLM_GENERATION');
    if (sample) {
      console.log(`- Stem: ${sample.stem}`);
      console.log(`- Options: ${JSON.stringify(sample.options)}`);
      console.log(`- Answer: [${sample.answer_letter}] (idx ${sample.answer_idx}): ${sample.options[sample.answer_idx]}`);
      console.log(`- Difficulty Tier: ${sample.difficulty_tier}`);
      console.log(`- Trap Type: ${sample.trap_type}`);
      console.log(`- All Gates Passed: ${sample.allGatesPassed}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error running real controlled pilot:', err);
  process.exit(1);
});
