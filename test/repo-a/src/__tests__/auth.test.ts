import { authenticate, requireRole } from "../middleware/auth";

describe("Auth Middleware", () => {
  describe("authenticate", () => {
    it("should pass with valid token", () => {
      const req = { headers: { authorization: "Bearer valid-token" } } as any;
      const res = {} as any;
      const next = jest.fn();
      authenticate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject missing token", () => {
      const req = { headers: {} } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should reject expired token", () => {
      const req = { headers: { authorization: "Bearer expired-token" } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("requireRole", () => {
    it("should allow admin access", () => {
      const req = { user: { role: "admin" } } as any;
      const res = {} as any;
      const next = jest.fn();
      requireRole("admin")(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should deny insufficient role", () => {
      const req = { user: { role: "member" } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();
      requireRole("admin")(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
