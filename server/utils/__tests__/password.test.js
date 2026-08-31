const { validatePassword } = require('../password');

describe('validatePassword', () => {
  test('should reject passwords shorter than 10 characters', () => {
    const shortPasswords = ['Short1!', 'abc123!'];
    
    shortPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must be at least 10 characters');
    });
  });

  test('should reject passwords without lowercase letter', () => {
    const passwords = ['UPPERCASE123!', 'ALLCAPS1234!'];
    
    passwords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });
  });

  test('should reject passwords without uppercase letter', () => {
    const passwords = ['lowercase123!', 'alllower1234!'];
    
    passwords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });
  });

  test('should reject passwords without number', () => {
    const passwords = ['NoNumbersHere!', 'AllLettersOnly!'];
    
    passwords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });
  });

  test('should reject passwords without symbol', () => {
    const passwords = ['NoSymbols123A', 'AllAlphanumeric1'];
    
    passwords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must contain at least one symbol (!@#$%^&* etc.)');
    });
  });

  test('should accept valid passwords with all requirements', () => {
    const validPasswords = [
      'ValidPass123!',
      'Str0ngP@ssword',
      'MySecure123#Pass',
      'Test@Password1',
      'Complex!Pass99',
    ];
    
    validPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  test('should reject empty or null passwords', () => {
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword(null).valid).toBe(false);
    expect(validatePassword(undefined).valid).toBe(false);
  });

  test('should accept passwords with minimum length (10 chars)', () => {
    const result = validatePassword('Test@12345');
    expect(result.valid).toBe(true);
  });

  test('should handle various special characters correctly', () => {
    const specialCharPasswords = [
      'Pass1234!test',
      'Pass1234@test',
      'Pass1234#test',
      'Pass1234$test',
      'Pass1234%test',
      'Pass1234^test',
      'Pass1234&test',
      'Pass1234*test',
      'Pass1234_test',
      'Pass1234-test',
      'Pass1234=test',
      'Pass1234[test]',
      'Pass1234{test}',
      'Pass1234;test',
      'Pass1234:test',
      'Pass1234"test',
      'Pass1234\'test',
      'Pass1234\\test',
      'Pass1234|test',
      'Pass1234,test',
      'Pass1234.test',
      'Pass1234<test>',
      'Pass1234/test?',
      'Pass1234`test',
      'Pass1234~test',
    ];
    
    specialCharPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(true);
    });
  });

  test('should return error object with correct structure', () => {
    const invalidResult = validatePassword('short');
    expect(invalidResult).toHaveProperty('valid', false);
    expect(invalidResult).toHaveProperty('error');
    expect(typeof invalidResult.error).toBe('string');

    const validResult = validatePassword('ValidPass123!');
    expect(validResult).toHaveProperty('valid', true);
    expect(validResult).not.toHaveProperty('error');
  });
});
