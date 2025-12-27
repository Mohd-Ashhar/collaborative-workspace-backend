const PasswordUtil = require("../../../src/utils/password.util");

describe("PasswordUtil", () => {
  describe("hash", () => {
    it("should hash a password", async () => {
      const password = "Test@12345";
      const hash = await PasswordUtil.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should generate different hashes for same password", async () => {
      const password = "Test@12345";
      const hash1 = await PasswordUtil.hash(password);
      const hash2 = await PasswordUtil.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("compare", () => {
    it("should return true for correct password", async () => {
      const password = "Test@12345";
      const hash = await PasswordUtil.hash(password);

      const result = await PasswordUtil.compare(password, hash);

      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "Test@12345";
      const wrongPassword = "Wrong@12345";
      const hash = await PasswordUtil.hash(password);

      const result = await PasswordUtil.compare(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe("validateStrength", () => {
    it("should accept strong password", () => {
      const result = PasswordUtil.validateStrength("Test@12345");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password without uppercase", () => {
      const result = PasswordUtil.validateStrength("test@12345");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain uppercase letter");
    });

    it("should reject password without lowercase", () => {
      const result = PasswordUtil.validateStrength("TEST@12345");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain lowercase letter");
    });

    it("should reject password without number", () => {
      const result = PasswordUtil.validateStrength("Test@Password");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain number");
    });

    it("should reject password without special character", () => {
      const result = PasswordUtil.validateStrength("Test12345");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain special character"
      );
    });

    it("should reject short password", () => {
      const result = PasswordUtil.validateStrength("Test@1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters");
    });
  });
});
