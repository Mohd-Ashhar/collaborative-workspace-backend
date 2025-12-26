const bcrypt = require("bcryptjs");

class PasswordUtil {
  // Hash password with salt rounds = 12 (secure & performant)
  static async hash(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare plain password with hashed password
  static async compare(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Validate password strength
  static validateStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!hasUpperCase) errors.push("Password must contain uppercase letter");
    if (!hasLowerCase) errors.push("Password must contain lowercase letter");
    if (!hasNumbers) errors.push("Password must contain number");
    if (!hasSpecialChar) errors.push("Password must contain special character");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PasswordUtil;
