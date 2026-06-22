import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKarmaDelta, voteWeightForKarma } from '../services/karmaService.js';

test('voteWeightForKarma caps reputation influence', () => {
  assert.equal(voteWeightForKarma(0), 1);
  assert.equal(voteWeightForKarma(25), 1.25);
  assert.equal(voteWeightForKarma(300), 2);
});

test('calculateKarmaDelta rewards consensus alignment and penalizes disagreement lightly', () => {
  assert.equal(calculateKarmaDelta({ voterValue: 1, evidenceWeightedScore: 3.4 }), 3.4);
  assert.equal(calculateKarmaDelta({ voterValue: -1, evidenceWeightedScore: 3 }), -1.5);
});
