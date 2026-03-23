# Skill: implement-feature

Use when:
- implementing a new feature
- modifying existing functionality

Steps:
1. Read docs/README.md
2. Read relevant specs:
   - docs/product/prd.md
   - docs/engineering/engineering-spec.md
   - docs/engineering/data-model.md
3. Identify minimal scope of change
4. Plan approach (small, explicit steps)
   - If there are any clarifications, ask questions first before making changes
5. List files to modify
6. Implement using existing patterns
7. Validate:
   - matches PRD intent
   - no schema violations
   - no hallucinated logic
8. Summarize changes and how to test

Rules:
- do not refactor unrelated code
- prefer minimal diffs
- do not add dependencies without justification or asking

Definition of Done:
- [ ] feature behavior matches PRD requirements
- [ ] only relevant files were modified
- [ ] no schema or type errors introduced
- [ ] no unrelated refactors performed
- [ ] implementation is minimal and consistent with existing patterns
- [ ] clear summary + testing steps provided