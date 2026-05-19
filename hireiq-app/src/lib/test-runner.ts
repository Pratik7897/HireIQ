/**
 * HireIQ Utility Test Runner
 * A lightweight test suite executing unit tests for shared recruitment utility functions.
 */

import { fmtDate, clamp, scoreColor, initials } from './utils';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${description}`);
    failed++;
  }
}

console.log('⚡ Starting HireIQ Utility Tests...\n');

// 1. fmtDate tests
assert('fmtDate correctly formats valid ISO date', fmtDate('2026-05-18') === 'May 18, 2026');
assert('fmtDate returns em dash for null/undefined/empty string', fmtDate(null) === '—');

// 2. clamp tests
assert('clamp clamps values below minimum', clamp(5, 10, 20) === 10);
assert('clamp clamps values above maximum', clamp(25, 10, 20) === 20);
assert('clamp preserves values within range', clamp(15, 10, 20) === 15);
assert('clamp handles negative inputs correctly', clamp(-5, 0, 10) === 0);
assert('clamp handles equal range bounds correctly', clamp(5, 5, 5) === 5);

// 3. scoreColor tests
assert('scoreColor green for high match score', scoreColor(85) === '#22c55e');
assert('scoreColor yellow for average match score', scoreColor(50) === '#eab308');
assert('scoreColor red for low match score', scoreColor(20) === '#ef4444');

// 4. initials tests
assert('initials extracts correct two-word initials', initials('Jane Doe') === 'JD');
assert('initials extracts single initial for one word', initials('Alexander') === 'A');
assert('initials returns question mark for empty string', initials('') === '?');

console.log(`\n🎉 Test Run Complete: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
