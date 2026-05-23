import { z } from 'zod';

const FindingCategoryEnum = z.enum([
  'segregation_of_duties',
  'missing_preventive_control',
  'missing_detective_control',
  'missing_corrective_control',
  'excessive_access',
  'documentation_gap',
  'manual_process_risk',
  'approval_chain_weakness',
]);

const RiskLevelEnum = z.enum(['critical', 'high', 'medium', 'low']);

const ConfidenceLabelEnum = z.enum(['high', 'medium', 'low', 'flagged']);

const ControlTypeEnum = z.enum(['preventive', 'detective', 'corrective', 'multiple']);

const FindingSchema = z.object({
  finding_id: z.string().uuid(),
  sequence: z.number().int().positive(),
  category: FindingCategoryEnum,
  title: z.string().max(80),
  description: z.string().min(1),
  affected_process_step: z.string().min(1),
  risk_level: RiskLevelEnum,
  confidence_score: z.number().min(0).max(1),
  confidence_label: ConfidenceLabelEnum,
  evidence_excerpt: z.string().min(1).max(200),
  recommendation: z.string().min(1),
  control_type_suggested: ControlTypeEnum,
});

export const AiResponseSchema = z.object({
  session_id: z.string(),
  analysis_timestamp: z.string(),
  document_metadata: z.object({
    filename: z.string(),
    process_name: z.string(),
    process_owner: z.string(),
    word_count: z.number().int(),
  }),
  findings: z.array(FindingSchema),
  summary: z.object({
    total_findings: z.number().int(),
    by_risk_level: z.object({
      critical: z.number().int(),
      high: z.number().int(),
      medium: z.number().int(),
      low: z.number().int(),
    }),
    by_category: z.record(z.number()),
    flagged_for_review_count: z.number().int(),
    overall_risk_assessment: z.string().max(300),
    key_themes: z.array(z.string()).max(3),
  }),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
export type ValidatedFinding = z.infer<typeof FindingSchema>;

export function validateAiResponse(raw: unknown): AiResponse {
  return AiResponseSchema.parse(raw);
}
