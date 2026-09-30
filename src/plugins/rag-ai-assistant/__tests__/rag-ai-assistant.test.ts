import { describe, expect, it } from 'vitest';
import { RAGEngine } from '../rag-engine';
import { RAG_KNOWLEDGE_BASE } from '../rag-knowledge-base';

describe('RAGEngine & Knowledge Base', () => {
  const engine = new RAGEngine();

  it('should have a populated knowledge base with at least 50 questions', () => {
    expect(RAG_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(50);
  });

  it('should answer overview questions correctly', () => {
    const res = engine.generateAnswer('What is ALT + F4?');
    expect(res.answer).toContain('ALT + F4');
    expect(res.answer).toContain('Space Situational Awareness');
  });

  it('should return controls when asking about mouse or camera navigation', () => {
    const res = engine.generateAnswer('How to rotate and zoom globe with mouse');
    expect(res.answer.toLowerCase()).toContain('left-click');
    expect(res.answer.toLowerCase()).toContain('rotate');
  });

  it('should answer astrodynamics questions about SGP4 and TLE', () => {
    const res = engine.generateAnswer('What is SGP4 and TLE format');
    expect(res.answer).toContain('SGP4');
    expect(res.answer).toContain('Two-Line Element');
  });

  it('should provide breakup and collision simulation instructions', () => {
    const res = engine.generateAnswer('satellite breakup and collision simulation');
    expect(res.answer).toContain('Breakup Model');
  });

  it('should list keyboard shortcuts', () => {
    const res = engine.generateAnswer('keyboard shortcuts hotkeys');
    expect(res.answer).toContain('Space');
    expect(res.answer).toContain('Shift + F');
  });

  it('should handle custom satellite creation questions', () => {
    const res = engine.generateAnswer('how to create custom satellite');
    expect(res.answer).toContain('Create-Sat');
  });

  it('should provide fallback for empty or unknown queries', () => {
    const res = engine.generateAnswer('xyzpdq123999');
    expect(res.answer).toContain('General Assistant Response');
    expect(res.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it('should answer general knowledge science and astronomy questions', () => {
    const res = engine.generateAnswer('What is a satellite?');
    expect(res.answer).toContain('Artificial Satellites');

    const moonRes = engine.generateAnswer('How far is the Moon?');
    expect(moonRes.answer).toContain('384,400 km');
  });

  it('should evaluate basic math expressions', () => {
    const res = engine.generateAnswer('2 + 2');
    expect(res.answer).toContain('4');
  });

  it('should handle greeting queries gracefully', () => {
    const res = engine.generateAnswer('hello bot');
    expect(res.answer).toContain('Hello');
    expect(res.suggestedQuestions).toContain('What is ALT + F4?');
  });
});

