---
source_file: "src/routes/index.ts"
type: file
community: 1
---

#tokendiet/file #tokendiet/community-1

- imports [[express]]
- imports [[.._controllers_taskController]]
- imports [[.._controllers_userController]]
- imports [[.._controllers_projectController]]
- imports [[.._services_taskService]]
- imports [[.._services_userService]]
- imports [[.._services_projectService]]
- imports [[.._middleware_auth]]
- imports [[.._middleware_validation]]
- imports [[.._models_user]]
- imports [[.._utils_logger]]
- contains [[logger_8]]
- contains [[createRouter]]

> Source: `src/routes/index.ts`