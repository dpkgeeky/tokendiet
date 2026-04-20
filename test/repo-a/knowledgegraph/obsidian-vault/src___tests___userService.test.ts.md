---
source_file: "src/__tests__/userService.test.ts"
type: file
community: 9
---

#tokendiet/file #tokendiet/community-9

- imports [[.._services_userService]]
- contains [[UserService]]
- contains [[authenticate_2]]
- contains [[should_authenticate_valid_credentials]]
- contains [[should_reject_invalid_password]]
- contains [[should_reject_non-existent_user]]
- contains [[createUser]]
- contains [[should_create_user_with_hashed_password]]
- contains [[should_reject_duplicate_email]]
- contains [[deactivateUser]]
- contains [[should_mark_user_as_inactive]]
- tests [[UserService_2]]

> Source: `src/__tests__/userService.test.ts`