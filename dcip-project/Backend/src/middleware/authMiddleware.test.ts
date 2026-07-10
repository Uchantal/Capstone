import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { protect, AuthRequest } from './authMiddleware'
import { Response, NextFunction } from 'express'

const JWT_SECRET = 'test_secret'

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

function makeNext(): NextFunction {
  return vi.fn() as unknown as NextFunction
}

function makeReq(authHeader?: string): AuthRequest {
  return {
    headers: { authorization: authHeader },
  } as unknown as AuthRequest
}

beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET
})

describe('protect middleware', () => {
  it('calls next() when a valid token is provided', () => {
    const token = jwt.sign({ id: 'user123', role: 'student' }, JWT_SECRET)
    const req = makeReq(`Bearer ${token}`)
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.userId).toBe('user123')
    expect(req.userRole).toBe('student')
  })

  it('attaches admin role correctly', () => {
    const token = jwt.sign({ id: 'admin456', role: 'admin' }, JWT_SECRET)
    const req = makeReq(`Bearer ${token}`)
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.userRole).toBe('admin')
  })

  it('returns 401 when no Authorization header is present', () => {
    const req = makeReq(undefined)
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorised: no token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const req = makeReq('Token abc123')
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorised: no token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the token is invalid', () => {
    const req = makeReq('Bearer this.is.not.a.valid.token')
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the token is signed with the wrong secret', () => {
    const token = jwt.sign({ id: 'user123', role: 'student' }, 'wrong_secret')
    const req = makeReq(`Bearer ${token}`)
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the token has expired', () => {
    const token = jwt.sign({ id: 'user123', role: 'student' }, JWT_SECRET, { expiresIn: -1 })
    const req = makeReq(`Bearer ${token}`)
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('does not attach userId or userRole when token is invalid', () => {
    const req = makeReq('Bearer bad.token.here')
    const res = makeRes()
    const next = makeNext()

    protect(req, res, next)

    expect(req.userId).toBeUndefined()
    expect(req.userRole).toBeUndefined()
  })
})
