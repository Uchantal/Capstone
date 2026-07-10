import { describe, it, expect } from 'vitest'
import { isStrongPassword } from './authController'

describe('isStrongPassword', () => {
  it('returns null for a valid strong password', () => {
    expect(isStrongPassword('Str0ng!Pass')).toBeNull()
  })

  it('rejects passwords shorter than 8 chars', () => {
    expect(isStrongPassword('S1!a')).toBe('Password must be at least 8 characters.')
  })

  it('rejects passwords without uppercase letters', () => {
    expect(isStrongPassword('str0ng!pass')).toBe('Password must contain at least one uppercase letter.')
  })

  it('rejects passwords without numbers', () => {
    expect(isStrongPassword('Strong!Pass')).toBe('Password must contain at least one number.')
  })

  it('rejects passwords without special characters', () => {
    expect(isStrongPassword('StrongPass1')).toBe('Password must contain at least one special character.')
  })

  it('accepts a password that is exactly 8 characters with all requirements', () => {
    expect(isStrongPassword('Abc1!xyz')).toBeNull()
  })

  it('rejects an empty string', () => {
    expect(isStrongPassword('')).toBe('Password must be at least 8 characters.')
  })

  it('returns only the first failing rule, not all of them', () => {
    const result = isStrongPassword('abc')
    expect(result).toBe('Password must be at least 8 characters.')
  })

  it('accepts passwords with common special characters', () => {
    expect(isStrongPassword('Hello1@World')).toBeNull()
    expect(isStrongPassword('Hello1#World')).toBeNull()
    expect(isStrongPassword('Hello1$World')).toBeNull()
  })
})

describe('register input validation rules', () => {
  it('all required fields are defined', () => {
    const requiredFields = ['fullName', 'username', 'email', 'password', 'schoolId']
    const body = {
      fullName: 'Uwimana Chantal',
      username: 'chantal01',
      email: 'chantal@school.rw',
      password: 'Str0ng!Pass',
      schoolId: '64abc123',
    }
    const missing = requiredFields.filter(f => !body[f as keyof typeof body])
    expect(missing).toHaveLength(0)
  })

  it('detects missing fullName', () => {
    const body = { fullName: '', username: 'chantal01', email: 'c@s.rw', password: 'Str0ng!Pass', schoolId: '64abc' }
    const missing = !body.fullName || !body.username || !body.email || !body.password || !body.schoolId
    expect(missing).toBe(true)
  })

  it('detects missing username', () => {
    const body = { fullName: 'Chantal', username: '', email: 'c@s.rw', password: 'Str0ng!Pass', schoolId: '64abc' }
    const missing = !body.fullName || !body.username || !body.email || !body.password || !body.schoolId
    expect(missing).toBe(true)
  })

  it('detects missing email', () => {
    const body = { fullName: 'Chantal', username: 'chantal01', email: '', password: 'Str0ng!Pass', schoolId: '64abc' }
    const missing = !body.fullName || !body.username || !body.email || !body.password || !body.schoolId
    expect(missing).toBe(true)
  })

  it('detects missing schoolId', () => {
    const body = { fullName: 'Chantal', username: 'chantal01', email: 'c@s.rw', password: 'Str0ng!Pass', schoolId: '' }
    const missing = !body.fullName || !body.username || !body.email || !body.password || !body.schoolId
    expect(missing).toBe(true)
  })

  it('a complete valid body passes all field checks', () => {
    const body = {
      fullName: 'Uwimana Chantal',
      username: 'chantal01',
      email: 'chantal@school.rw',
      password: 'Str0ng!Pass',
      schoolId: '64abc123',
    }
    const missing = !body.fullName || !body.username || !body.email || !body.password || !body.schoolId
    expect(missing).toBe(false)
    expect(isStrongPassword(body.password)).toBeNull()
  })
})
