import { UserService } from "../services/userService";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe("authenticate", () => {
    it("should authenticate valid credentials", async () => {
      const user = await service.authenticate("admin@test.com", "password123");
      expect(user).toBeDefined();
      expect(user.email).toBe("admin@test.com");
    });

    it("should reject invalid password", async () => {
      await expect(service.authenticate("admin@test.com", "wrong")).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should reject non-existent user", async () => {
      await expect(service.authenticate("nobody@test.com", "pass")).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("createUser", () => {
    it("should create user with hashed password", async () => {
      const user = await service.createUser({
        email: "new@test.com",
        name: "New User",
        password: "secure123",
        role: "member",
      });
      expect(user.password).not.toBe("secure123");
    });

    it("should reject duplicate email", async () => {
      await expect(
        service.createUser({
          email: "admin@test.com",
          name: "Dup",
          password: "pass",
          role: "member",
        })
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("deactivateUser", () => {
    it("should mark user as inactive", async () => {
      const user = await service.deactivateUser("user-1");
      expect(user.active).toBe(false);
    });
  });
});
