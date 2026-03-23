# Skill: eval-ai-output

Use when:
- evaluating AI-generated outputs

Check:
- schema validity (output-spec.md)
- presence of real user evidence
- completeness of fields
- clarity and usefulness

Return:
- pass / fail
- list of issues
- suggested improvements

Rules:
- do not rewrite output unless asked
- focus on evaluation only

Definition of Done:
- [ ] output evaluated against output-spec.md
- [ ] hallucinated content (if any) identified
- [ ] missing or weak sections identified
- [ ] clear pass/fail decision provided
- [ ] actionable improvement suggestions included