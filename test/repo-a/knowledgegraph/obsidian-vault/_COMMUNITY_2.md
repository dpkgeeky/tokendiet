---
type: community
community_id: 2
member_count: 18
---

# Community 2

#tokendiet/community-2

## Members (18)
- [[src_models_project.ts]]
- [[._task]]
- [[._user]]
- [[Project]]
- [[CreateProjectDTO]]
- [[UpdateProjectDTO]]
- [[ProjectSummary]]
- [[computeProjectSummary]]
- [[isProjectMember]]
- [[getActiveProjects]]
- [[src_models_user.ts]]
- [[User]]
- [[CreateUserDTO]]
- [[UpdateUserDTO]]
- [[UserPublicProfile]]
- [[toPublicProfile]]
- [[hasPermission]]
- [[isValidEmail]]

## Bridge Nodes
- [[src_models_project.ts]] (9 connections)
- [[src_models_user.ts]] (7 connections)
- [[computeProjectSummary]] (2 connections)
- [[toPublicProfile]] (2 connections)
- [[hasPermission]] (2 connections)

## Connected Communities
- [[_COMMUNITY_3]]
- [[_COMMUNITY_4]]

## Dataview Query
```dataview
TABLE source_file, type
FROM #tokendiet/community-2
SORT type ASC
```