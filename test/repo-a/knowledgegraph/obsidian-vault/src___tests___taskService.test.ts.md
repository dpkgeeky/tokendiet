---
source_file: "src/__tests__/taskService.test.ts"
type: file
community: 3
---

#tokendiet/file #tokendiet/community-3

- imports [[.._services_taskService]]
- contains [[TaskService]]
- contains [[createTask]]
- contains [[should_create_a_task_with_valid_input]]
- contains [[should_reject_task_with_empty_title]]
- contains [[should_set_default_status_to_pending]]
- contains [[updateTask]]
- contains [[should_update_task_status]]
- contains [[should_throw_on_non-existent_task]]
- contains [[findByStatus]]
- contains [[should_filter_tasks_by_status]]
- contains [[should_return_empty_array_for_no_matches]]
- tests [[TaskService_2]]

> Source: `src/__tests__/taskService.test.ts`