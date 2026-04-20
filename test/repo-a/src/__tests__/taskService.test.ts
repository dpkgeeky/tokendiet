import { TaskService } from "../services/taskService";

describe("TaskService", () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
  });

  describe("createTask", () => {
    it("should create a task with valid input", async () => {
      const task = await service.createTask({
        title: "Test Task",
        description: "A test task",
        priority: "high",
        assigneeId: "user-1",
      });
      expect(task).toBeDefined();
      expect(task.title).toBe("Test Task");
    });

    it("should reject task with empty title", async () => {
      await expect(
        service.createTask({ title: "", description: "", priority: "low", assigneeId: "user-1" })
      ).rejects.toThrow("Title is required");
    });

    it("should set default status to pending", async () => {
      const task = await service.createTask({
        title: "New Task",
        description: "desc",
        priority: "medium",
        assigneeId: "user-1",
      });
      expect(task.status).toBe("pending");
    });
  });

  describe("updateTask", () => {
    it("should update task status", async () => {
      const updated = await service.updateTask("task-1", { status: "in_progress" });
      expect(updated.status).toBe("in_progress");
    });

    it("should throw on non-existent task", async () => {
      await expect(service.updateTask("nonexistent", { status: "done" })).rejects.toThrow(
        "Task not found"
      );
    });
  });

  describe("findByStatus", () => {
    it("should filter tasks by status", async () => {
      const tasks = await service.findByStatus("pending");
      expect(tasks.every((t) => t.status === "pending")).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const tasks = await service.findByStatus("archived");
      expect(tasks).toHaveLength(0);
    });
  });
});
