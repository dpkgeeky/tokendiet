import { ProjectService } from "../services/projectService";

describe("ProjectService", () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
  });

  describe("createProject", () => {
    it("should create a project with owner", async () => {
      const project = await service.createProject({
        name: "Test Project",
        description: "Testing",
        ownerId: "user-1",
      });
      expect(project.name).toBe("Test Project");
      expect(project.ownerId).toBe("user-1");
    });

    it("should auto-add owner as member", async () => {
      const project = await service.createProject({
        name: "P",
        description: "d",
        ownerId: "user-1",
      });
      expect(project.members).toContain("user-1");
    });
  });

  describe("addMember", () => {
    it("should add member to project", async () => {
      const project = await service.addMember("project-1", "user-2");
      expect(project.members).toContain("user-2");
    });

    it("should not duplicate members", async () => {
      await service.addMember("project-1", "user-1");
      const project = await service.addMember("project-1", "user-1");
      const count = project.members.filter((m: string) => m === "user-1").length;
      expect(count).toBe(1);
    });
  });

  describe("getProjectStats", () => {
    it("should return task counts by status", async () => {
      const stats = await service.getProjectStats("project-1");
      expect(stats).toHaveProperty("totalTasks");
      expect(stats).toHaveProperty("completedTasks");
    });
  });
});
