import { validateAiResponse } from '../../src/analysis/findings-schema';

const validFinding = {
  finding_id: '550e8400-e29b-41d4-a716-446655440000',
  sequence: 1,
  category: 'segregation_of_duties',
  title: 'No segregation in payment approval',
  description: 'The same person approves and executes payments.',
  affected_process_step: 'Payment execution',
  risk_level: 'high',
  confidence_score: 0.9,
  confidence_label: 'high',
  evidence_excerpt: 'The controller approves and processes all payments.',
  recommendation: 'Separate approval and execution roles.',
  control_type_suggested: 'preventive',
};

const validResponse = {
  session_id: 'abc-123',
  analysis_timestamp: '2025-01-01T00:00:00Z',
  document_metadata: {
    filename: 'process.pdf',
    process_name: 'Budget Process',
    process_owner: 'Finance Team',
    word_count: 500,
  },
  findings: [validFinding],
  summary: {
    total_findings: 1,
    by_risk_level: { critical: 0, high: 1, medium: 0, low: 0 },
    by_category: { segregation_of_duties: 1 },
    flagged_for_review_count: 0,
    overall_risk_assessment: 'High risk due to missing segregation of duties.',
    key_themes: ['segregation_of_duties'],
  },
};

describe('validateAiResponse', () => {
  it('accepts a fully valid AI response', () => {
    const result = validateAiResponse(validResponse);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].category).toBe('segregation_of_duties');
  });

  it('accepts an empty findings array', () => {
    const result = validateAiResponse({
      ...validResponse,
      findings: [],
      summary: { ...validResponse.summary, total_findings: 0, by_risk_level: { critical: 0, high: 0, medium: 0, low: 0 } },
    });
    expect(result.findings).toHaveLength(0);
  });

  it('rejects an unrecognised finding category', () => {
    const invalid = { ...validFinding, category: 'unknown_category' };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects a finding with confidence_score outside 0–1', () => {
    const invalid = { ...validFinding, confidence_score: 1.5 };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects a finding with evidence_excerpt exceeding 200 characters', () => {
    const invalid = { ...validFinding, evidence_excerpt: 'x'.repeat(201) };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects a finding with empty evidence_excerpt', () => {
    const invalid = { ...validFinding, evidence_excerpt: '' };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects a finding with invalid risk_level', () => {
    const invalid = { ...validFinding, risk_level: 'extreme' };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects a response missing document_metadata', () => {
    const { document_metadata: _, ...withoutMeta } = validResponse;
    expect(() => validateAiResponse(withoutMeta)).toThrow();
  });

  it('rejects a title longer than 80 characters', () => {
    const invalid = { ...validFinding, title: 't'.repeat(81) };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });

  it('rejects an invalid control_type_suggested value', () => {
    const invalid = { ...validFinding, control_type_suggested: 'automated' };
    expect(() => validateAiResponse({ ...validResponse, findings: [invalid] })).toThrow();
  });
});
