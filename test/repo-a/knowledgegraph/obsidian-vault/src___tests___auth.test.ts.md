---
source_file: "src/__tests__/auth.test.ts"
type: file
community: 10
---

#tokendiet/file #tokendiet/community-10

- imports [[.._middleware_auth]]
- contains [[Auth_Middleware]]
- contains [[authenticate]]
- contains [[should_pass_with_valid_token]]
- contains [[should_reject_missing_token]]
- contains [[should_reject_expired_token]]
- contains [[requireRole]]
- contains [[should_allow_admin_access]]
- contains [[should_deny_insufficient_role]]
- tests [[AuthenticatedRequest]]

> Source: `src/__tests__/auth.test.ts`