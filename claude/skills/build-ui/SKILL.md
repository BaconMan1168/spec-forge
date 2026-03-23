# Skill: build-ui

Use when:
- creating or modifying UI
- building components or pages

Steps:
1. Read docs/product/design-system.md
2. Read docs/product/user-flows.md (if interaction changes)
3. Identify existing components to reuse
4. Implement UI using design system tokens only
5. Add required states:
   - loading
   - empty
   - error
6. Validate:
   - no new tokens introduced
   - consistent spacing/typography
   - accessible structure

Rules:
- never invent colors, spacing, or typography
- prefer reuse over new components
- keep UI simple and consistent

Definition of Done:
- [ ] UI strictly follows design-system.md
- [ ] no new design tokens were introduced
- [ ] existing components reused where possible
- [ ] loading, empty, and error states exist
- [ ] layout and typography are consistent
- [ ] UI is accessible (basic keyboard navigation + contrast)