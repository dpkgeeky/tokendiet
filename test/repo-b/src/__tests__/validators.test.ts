import { isEmail, isRequired, minLength, maxLength, isUrl, isNumeric } from "../utils/validators";

describe("validators", () => {
  describe("isEmail", () => {
    it("should accept valid emails", () => {
      expect(isEmail("user@example.com")).toBe(true);
      expect(isEmail("name.last@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isEmail("not-an-email")).toBe(false);
      expect(isEmail("@domain.com")).toBe(false);
      expect(isEmail("user@")).toBe(false);
    });
  });

  describe("isRequired", () => {
    it("should reject empty values", () => {
      expect(isRequired("")).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });

    it("should accept non-empty values", () => {
      expect(isRequired("hello")).toBe(true);
      expect(isRequired(0)).toBe(true);
    });
  });

  describe("minLength", () => {
    it("should validate minimum length", () => {
      expect(minLength("abc", 3)).toBe(true);
      expect(minLength("ab", 3)).toBe(false);
    });
  });

  describe("maxLength", () => {
    it("should validate maximum length", () => {
      expect(maxLength("abc", 5)).toBe(true);
      expect(maxLength("abcdef", 5)).toBe(false);
    });
  });

  describe("isUrl", () => {
    it("should accept valid URLs", () => {
      expect(isUrl("https://example.com")).toBe(true);
      expect(isUrl("http://localhost:3000/path")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isUrl("not a url")).toBe(false);
      expect(isUrl("ftp://old")).toBe(false);
    });
  });

  describe("isNumeric", () => {
    it("should accept numeric strings", () => {
      expect(isNumeric("123")).toBe(true);
      expect(isNumeric("3.14")).toBe(true);
    });

    it("should reject non-numeric strings", () => {
      expect(isNumeric("abc")).toBe(false);
      expect(isNumeric("12px")).toBe(false);
    });
  });
});
