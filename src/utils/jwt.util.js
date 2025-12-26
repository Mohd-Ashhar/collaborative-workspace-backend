const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtil {
  // Generate Access Token (short-lived)
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'workspace-api',
      audience: 'workspace-client',
    });
  }

  // Generate Refresh Token (long-lived)
  static generateRefreshToken(payload) {
    const jti = crypto.randomUUID(); // Unique token ID for tracking
    return {
      token: jwt.sign(
        { ...payload, jti },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
          issuer: 'workspace-api',
          audience: 'workspace-client',
        }
      ),
      jti,
    };
  }

  // Verify Access Token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'workspace-api',
        audience: 'workspace-client',
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify Refresh Token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'workspace-api',
        audience: 'workspace-client',
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Generate Token Pair
  static generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const { token: refreshToken, jti } = this.generateRefreshToken(payload);
    
    return { accessToken, refreshToken, jti };
  }
}

module.exports = JWTUtil;
