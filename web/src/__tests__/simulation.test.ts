import { describe, it, expect } from 'vitest';
import {
  I130_SPOUSAL_SCENARIO,
  calculateScore,
  getGradeColor,
  getGradeLabel,
  type PhaseDecision,
} from '@/lib/simulation-data';

describe('Simulation scenario data', () => {
  it('has the correct number of phases', () => {
    expect(I130_SPOUSAL_SCENARIO.phases.length).toBe(8);
  });

  it('has unique phase numbers from 1-8', () => {
    const numbers = I130_SPOUSAL_SCENARIO.phases.map(p => p.number);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('every phase has required fields', () => {
    for (const phase of I130_SPOUSAL_SCENARIO.phases) {
      expect(phase.title).toBeDefined();
      expect(phase.contextLabel).toBeTruthy();
      expect(phase.event).toBeTruthy();
      expect(phase.eventType).toBeTruthy();
      expect(phase.learningObjective).toBeTruthy();
      expect(phase.guidance).toBeDefined();
      expect(phase.guidance.whyItMatters).toBeTruthy();
    }
  });

  it('decision phases have valid decision structures', () => {
    const decisionPhases = I130_SPOUSAL_SCENARIO.phases.filter(p => p.decision);
    expect(decisionPhases.length).toBe(7); // phases 1-7 have decisions, phase 8 does not

    for (const phase of decisionPhases) {
      expect(phase.decision!.prompt).toBeTruthy();
      expect(phase.decision!.options.length).toBeGreaterThanOrEqual(3);
      expect(phase.decision!.correctOptionId).toBeTruthy();

      // Correct option ID must exist in the options
      const correctOption = phase.decision!.options.find(o => o.id === phase.decision!.correctOptionId);
      expect(correctOption).toBeDefined();

      // All option IDs must be unique within a phase
      const ids = phase.decision!.options.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);

      // All options must have label and text
      for (const opt of phase.decision!.options) {
        expect(opt.label).toBeTruthy();
        expect(opt.text).toBeTruthy();
      }
    }
  });

  it('chat phases have client chat openers', () => {
    const chatPhases = I130_SPOUSAL_SCENARIO.phases.filter(p => p.hasClientChat);
    expect(chatPhases.length).toBeGreaterThanOrEqual(3);

    for (const phase of chatPhases) {
      expect(phase.clientChatOpener).toBeTruthy();
    }
  });

  it('has fallback feedback for all decision phases', () => {
    const decisionPhases = I130_SPOUSAL_SCENARIO.phases.filter(p => p.decision);
    for (const phase of decisionPhases) {
      expect(phase.fallbackFeedback.correct).toBeTruthy();
      expect(phase.fallbackFeedback.incorrect).toBeTruthy();
    }
  });

  it('phase 4 is the concurrent filing decision', () => {
    const phase4 = I130_SPOUSAL_SCENARIO.phases.find(p => p.number === 4);
    expect(phase4?.title).toContain('Filing');
    expect(phase4?.decision?.correctOptionId).toBe('b');
    // The correct answer mentions concurrent filing
    const correctOpt = phase4?.decision?.options.find(o => o.id === 'b');
    expect(correctOpt?.text.toLowerCase()).toContain('concurrent');
  });

  it('phase 8 is the resolution with no decision', () => {
    const phase8 = I130_SPOUSAL_SCENARIO.phases.find(p => p.number === 8);
    expect(phase8?.eventType).toBe('resolution');
    expect(phase8?.decision).toBeUndefined();
  });

  it('client data is complete', () => {
    const client = I130_SPOUSAL_SCENARIO.client;
    expect(client.name).toBeTruthy();
    expect(client.initials).toBeTruthy();
    expect(client.country).toBeTruthy();
    expect(client.language).toBeTruthy();
    expect(client.facts.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Score calculation', () => {
  it('returns 0 for empty decisions', () => {
    const result = calculateScore([]);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('calculates perfect score', () => {
    const decisions: PhaseDecision[] = [
      { phase: 1, selectedOptionId: 'b', correct: true, score: 100, explanation: '' },
      { phase: 2, selectedOptionId: 'b', correct: true, score: 100, explanation: '' },
    ];
    const result = calculateScore(decisions);
    expect(result.score).toBe(200);
    expect(result.maxScore).toBe(200);
    expect(result.percentage).toBe(100);
  });

  it('calculates mixed score', () => {
    const decisions: PhaseDecision[] = [
      { phase: 1, selectedOptionId: 'b', correct: true, score: 100, explanation: '' },
      { phase: 2, selectedOptionId: 'a', correct: false, score: 25, explanation: '' },
    ];
    const result = calculateScore(decisions);
    expect(result.score).toBe(125);
    expect(result.maxScore).toBe(200);
    expect(result.percentage).toBe(63);
  });
});

describe('Grade display', () => {
  it('returns correct colors', () => {
    expect(getGradeColor(90)).toBe('#16a34a');
    expect(getGradeColor(70)).toBe('#d97706');
    expect(getGradeColor(40)).toBe('#dc2626');
  });

  it('returns correct labels', () => {
    expect(getGradeLabel(95)).toBe('Excellent');
    expect(getGradeLabel(85)).toBe('Good');
    expect(getGradeLabel(65)).toBe('Needs Improvement');
    expect(getGradeLabel(40)).toBe('Review Required');
  });
});
