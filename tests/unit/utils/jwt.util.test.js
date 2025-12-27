const JWTUtil = require("../../../src/utils/jwt.util");

describe("JWTUtil", () => {
  const testPayload = {
    userId: 1,
    email: "test@example.com",
  };

  describe("generateAccessToken", () => {
    it("should generate access token", () => {
      const token = JWTUtil.generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate refresh token with jti", () => {
      const { token, jti } = JWTUtil.generateRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(jti).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", () => {
      const token = JWTUtil.generateAccessToken(testPayload);
      const decoded = JWTUtil.verifyAccessToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it("should throw error for invalid token", () => {
      expect(() => {
        JWTUtil.verifyAccessToken("invalid.token.here");
      }).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", () => {
      const { token } = JWTUtil.generateRefreshToken(testPayload);
      const decoded = JWTUtil.verifyRefreshToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.jti).toBeDefined();
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      const { accessToken, refreshToken, jti } =
        JWTUtil.generateTokenPair(testPayload);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(jti).toBeDefined();
    });
  });
});
