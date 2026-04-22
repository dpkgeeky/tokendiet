# Knowledge Graph Report
_Generated 2026-04-21_

## Token Savings
| Metric | Value |
|--------|-------|
| Raw codebase tokens | ~17,144 |
| Compressed graph tokens | ~3,504 |
| **Reduction** | **80%** |

## Graph Summary
| Metric | Count |
|--------|-------|
| Files | 24 |
| Nodes | 207 |
| Edges | 347 |
| Communities | 15 |
| Isolated nodes | 1 |

## Edge Confidence
| Level | Count | % |
|-------|-------|---|
| EXTRACTED | 231 | 67% |
| INFERRED | 115 | 33% |
| AMBIGUOUS | 1 | 0% |

## God Nodes (most connected)
| Node | Connections |
|------|-------------|
| createRouter | 16 |
| logger | 15 |
| src/middleware/validation.ts | 14 |
| src/__tests__/taskService.test.ts | 13 |
| logger | 13 |
| src/routes/index.ts | 13 |
| src/__tests__/userService.test.ts | 12 |
| logger | 12 |
| bootstrap | 12 |
| src/__tests__/projectService.test.ts | 11 |

## Communities
### Community 0: config (31 nodes)
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

### Community 1: middleware (21 nodes)
- ProjectController
- BaseController
- TaskController
- UserController
- src/middleware/validation.ts
- ../models/task
- ValidatorFn
- required
- minLength
- maxLength
- emailValidator
- validateBody
- validateTaskStatus
- validateTaskPriority
- parsePagination
- _...and 6 more_

### Community 2: controllers (19 nodes)
- ../middleware/auth
- ../utils/logger
- src/controllers/projectController.ts
- express
- ./taskController
- ../middleware/errorHandler
- ../middleware/validation
- ../utils/helpers
- src/controllers/taskController.ts
- logger
- src/controllers/userController.ts
- ../models/user
- ../config/app
- src/services/projectService.ts
- ../models/project
- _...and 4 more_

### Community 3: __tests__ (19 nodes)
- src/__tests__/taskService.test.ts
- ../services/taskService
- TaskService
- createTask
- should create a task with valid input
- should reject task with empty title
- should set default status to pending
- updateTask
- should update task status
- should throw on non-existent task
- findByStatus
- should filter tasks by status
- should return empty array for no matches
- TaskService
- createTask
- _...and 4 more_

### Community 4: models (18 nodes)
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

### Community 5: middleware (17 nodes)
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
- ValidationError
- UnauthorizedError
- _...and 2 more_

### Community 6: services (13 nodes)
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

### Community 7: __tests__ (12 nodes)
- src/__tests__/userService.test.ts
- ../services/userService
- UserService
- authenticate
- should authenticate valid credentials
- should reject invalid password
- should reject non-existent user
- createUser
- should create user with hashed password
- should reject duplicate email
- deactivateUser
- should mark user as inactive

### Community 8: utils (12 nodes)
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

### Community 9: __tests__ (11 nodes)
- src/__tests__/projectService.test.ts
- ../services/projectService
- ProjectService
- createProject
- should create a project with owner
- should auto-add owner as member
- addMember
- should add member to project
- should not duplicate members
- getProjectStats
- should return task counts by status

### Community 10: src (10 nodes)
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

### Community 11: __tests__ (9 nodes)
- src/__tests__/auth.test.ts
- Auth Middleware
- authenticate
- should pass with valid token
- should reject missing token
- should reject expired token
- requireRole
- should allow admin access
- should deny insufficient role

### Community 12: services (7 nodes)
- logger
- ProjectService
- createProject
- updateProject
- addMember
- getProjectSummary
- findByMember

### Community 13: models (7 nodes)
- src/models/task.ts
- Task
- CreateTaskDTO
- UpdateTaskDTO
- isValidStatus
- isValidPriority
- getDefaultTask

### Community 14: codeburn-2026-04-20.json (1 nodes)
- codeburn-2026-04-20.json

## Potentially Unused Code
_Entities with no inbound references (may be entry points or dead code)_

- logger (function) in src/app.ts
- AppConfig (interface) in src/config/app.ts
- DEFAULT_PAGE_SIZE (function) in src/config/app.ts
- MAX_PAGE_SIZE (function) in src/config/app.ts
- DatabaseConfig (interface) in src/config/database.ts
- DatabaseConnection (class) in src/config/database.ts
- logger (function) in src/controllers/projectController.ts
- logger (function) in src/controllers/taskController.ts
- logger (function) in src/controllers/userController.ts
- logger (function) in src/index.ts
- logger (function) in src/middleware/auth.ts
- generateToken (function) in src/middleware/auth.ts
- logger (function) in src/middleware/errorHandler.ts
- NotFoundError (class) in src/middleware/errorHandler.ts
- errorHandler (function) in src/middleware/errorHandler.ts
- ValidatorFn (interface) in src/middleware/validation.ts
- maxLength (function) in src/middleware/validation.ts
- validateTaskStatus (function) in src/middleware/validation.ts
- validateTaskPriority (function) in src/middleware/validation.ts
- Project (interface) in src/models/project.ts
- _...and 24 more_

## Cross-Community Coupling
_Community pairs with high inter-dependency_

- middleware ↔ controllers: 13 edges
- middleware ↔ middleware: 6 edges

## Isolated Nodes
- codeburn-2026-04-20.json
