---
type: community
community_id: 2
member_count: 18
---

# Community 2

#tokendiet/community-2

## Members (18)
- [[src___tests___taskService.test.ts]]
- [[TaskService]]
- [[createTask]]
- [[should_create_a_task_with_valid_input]]
- [[should_reject_task_with_empty_title]]
- [[should_set_default_status_to_pending]]
- [[updateTask]]
- [[should_update_task_status]]
- [[should_throw_on_non-existent_task]]
- [[findByStatus]]
- [[should_filter_tasks_by_status]]
- [[should_return_empty_array_for_no_matches]]
- [[TaskService_2]]
- [[createTask_2]]
- [[updateTask_2]]
- [[findByProject]]
- [[findByAssignee]]
- [[findByStatus_2]]

## Bridge Nodes
- [[src___tests___taskService.test.ts]] (13 connections)
- [[TaskService_2]] (10 connections)
- [[TaskService]] (1 connections)
- [[createTask]] (1 connections)
- [[should_create_a_task_with_valid_input]] (1 connections)

## Connected Communities
- [[_COMMUNITY_1]]
- [[_COMMUNITY_5]]
- [[_COMMUNITY_6]]

## Dataview Query
```dataview
TABLE source_file, type
FROM #tokendiet/community-2
SORT type ASC
```