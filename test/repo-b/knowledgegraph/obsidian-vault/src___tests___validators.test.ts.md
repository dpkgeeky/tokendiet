---
source_file: "src/__tests__/validators.test.ts"
type: file
community: 1
---

#tokendiet/file #tokendiet/community-1

- imports [[.._utils_validators]]
- contains [[validators]]
- contains [[isEmail]]
- contains [[should_accept_valid_emails]]
- contains [[should_reject_invalid_emails]]
- contains [[isRequired]]
- contains [[should_reject_empty_values]]
- contains [[should_accept_non-empty_values]]
- contains [[minLength]]
- contains [[should_validate_minimum_length]]
- contains [[maxLength]]
- contains [[should_validate_maximum_length]]
- contains [[isUrl]]
- contains [[should_accept_valid_URLs]]
- contains [[should_reject_invalid_URLs]]
- contains [[isNumeric]]
- contains [[should_accept_numeric_strings]]
- contains [[should_reject_non-numeric_strings]]
- tests [[composeValidators]]

> Source: `src/__tests__/validators.test.ts`