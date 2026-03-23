# Skill: ai-pipeline

Use when:
- modifying AI logic
- updating prompts or generation pipeline

Steps:
1. Read docs/ai/ai-system-spec.md
2. Read docs/ai/prompt-design.md
3. Read docs/ai/output-spec.md
4. Identify which stage is affected:
   - synthesis
   - proposal generation
5. Modify logic or prompt
6. Validate:
   - strict schema compliance
   - no hallucinated quotes
   - deterministic structure

Rules:
- output-spec.md is the final authority
- never fabricate user evidence
- do not change schema without updating spec

Definition of Done:
- [ ] output strictly matches output-spec.md schema
- [ ] no hallucinated quotes or evidence
- [ ] pipeline behavior aligns with ai-system-spec.md
- [ ] changes are isolated to the correct stage
- [ ] outputs are deterministic and consistent