# Knowledge Graph Report
_Generated 2026-04-19_

## Token Savings
| Metric | Value |
|--------|-------|
| Raw codebase tokens | ~10,705 |
| Compressed graph tokens | ~2,735 |
| **Reduction** | **74%** |

## Graph Summary
| Metric | Count |
|--------|-------|
| Files | 20 |
| Nodes | 165 |
| Edges | 301 |
| Communities | 12 |
| Isolated nodes | 1 |

## Edge Confidence
| Level | Count | % |
|-------|-------|---|
| EXTRACTED | 189 | 63% |
| INFERRED | 111 | 37% |
| AMBIGUOUS | 1 | 0% |

## God Nodes (most connected)
| Node | Connections |
|------|-------------|
| createRouter | 16 |
| logger | 15 |
| src/middleware/validation.ts | 14 |
| logger | 13 |
| src/routes/index.ts | 13 |
| logger | 12 |
| bootstrap | 12 |
| src/middleware/auth.ts | 11 |
| src/utils/helpers.ts | 11 |
| src/controllers/projectController.ts | 10 |

## Communities
### Community 0 (31 nodes)
- logger
- createApp
- src/config/app.ts
- AppConfig
- loadAppConfig
- validateAppConfig
- configureLogger
- DEFAULT_PAGE_SIZE
- MAX_PAGE_SIZE
- src/config/database.ts
- DatabaseConfig
- DatabaseConnection
- getInstance
- connect
- disconnect
- _...and 16 more_

### Community 1 (30 nodes)
- ../utils/logger
- src/controllers/projectController.ts
- express
- ../services/projectService
- ./taskController
- ../middleware/errorHandler
- ../middleware/auth
- ../middleware/validation
- ../utils/helpers
- src/controllers/taskController.ts
- ../services/taskService
- logger
- BaseController
- TaskController
- src/controllers/userController.ts
- _...and 15 more_

### Community 2 (18 nodes)
- src/models/project.ts
- ./task
- ./user
- Project
- CreateProjectDTO
- UpdateProjectDTO
- ProjectSummary
- computeProjectSummary
- isProjectMember
- getActiveProjects
- src/models/user.ts
- User
- CreateUserDTO
- UpdateUserDTO
- UserPublicProfile
- _...and 3 more_

### Community 3 (16 nodes)
- src/middleware/auth.ts
- ./errorHandler
- logger
- AuthenticatedRequest
- extractToken
- authenticate
- requireRole
- decodeToken
- generateToken
- src/middleware/errorHandler.ts
- logger
- AppError
- NotFoundError
- UnauthorizedError
- ForbiddenError
- _...and 1 more_

### Community 4 (14 nodes)
- ProjectController
- ValidationError
- src/middleware/validation.ts
- ValidatorFn
- required
- minLength
- maxLength
- emailValidator
- validateBody
- validateTaskStatus
- validateTaskPriority
- parsePagination
- logger
- createRouter

### Community 5 (13 nodes)
- logger
- BaseService
- findById
- findAll
- deleteById
- count
- UserService
- createUser
- authenticate
- updateUser
- deactivateUser
- findByEmail
- getPublicProfile

### Community 6 (12 nodes)
- src/utils/helpers.ts
- crypto
- generateId
- slugify
- PaginationOptions
- PaginatedResult
- paginate
- formatDate
- formatDateTime
- omitKeys
- pickKeys
- delay

### Community 7 (10 nodes)
- src/app.ts
- cors
- helmet
- ./routes
- ./middleware/errorHandler
- ./config/app
- ./utils/logger
- src/index.ts
- ./app
- ./config/database

### Community 8 (7 nodes)
- logger
- ProjectService
- createProject
- updateProject
- addMember
- getProjectSummary
- findByMember

### Community 9 (7 nodes)
- src/models/task.ts
- Task
- CreateTaskDTO
- UpdateTaskDTO
- isValidStatus
- isValidPriority
- getDefaultTask

### Community 10 (6 nodes)
- TaskService
- createTask
- updateTask
- findByProject
- findByAssignee
- findByStatus

### Community 11 (1 nodes)
- package.json

## Isolated Nodes
- package.json
