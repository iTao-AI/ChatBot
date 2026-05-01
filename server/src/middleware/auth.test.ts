import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './auth';
import { Request, Response } from 'express';

function mockRequest(headers: Record<string, string>): Partial<AuthRequest> {
  return { headers } as unknown as AuthRequest;
}

function mockResponse(): Partial<Response> {
  return {
    status: (code: number) => ({ json: (body: unknown) => ({ status: code, body }) }) as any,
    json: (body: unknown) => ({ body }) as any,
  };
}

const SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-secret';

describe('authMiddleware', () => {
  it('rejects requests without Authorization header', () => {
    const req = mockRequest({});
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with expired token', () => {
    const expiredToken = jwt.sign({ userId: '123' }, SECRET, { expiresIn: '-1h' });
    const req = mockRequest({ authorization: `Bearer ${expiredToken}` });
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid tokens and sets userId', () => {
    const token = jwt.sign({ userId: 'user-123' }, SECRET, { expiresIn: '15m' });
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req as AuthRequest, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).userId).toBe('user-123');
  });
});
