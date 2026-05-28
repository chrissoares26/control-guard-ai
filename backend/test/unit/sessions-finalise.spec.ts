import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { SessionsService } from '../../src/sessions/sessions.service';

const mockUser = { id: 'user-1', username: 'auditor' };

function makeService(prismaOverrides: Partial<any> = {}) {
  const prisma = {
    session: { findUnique: jest.fn(), update: jest.fn() },
    finding: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
    ...prismaOverrides,
  } as any;
  const auditLog = { log: jest.fn() } as any;
  return new SessionsService(prisma, auditLog);
}

describe('SessionsService.finalise', () => {
  it('throws NotFoundException when session does not exist', async () => {
    const service = makeService({ session: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    await expect(service.finalise(mockUser, 'missing-id')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when session belongs to another user', async () => {
    const service = makeService({
      session: {
        findUnique: jest.fn().mockResolvedValue({ id: 's-1', userId: 'other-user', status: 'IN_REVIEW', findings: [] }),
        update: jest.fn(),
      },
    });
    await expect(service.finalise(mockUser, 's-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws UnprocessableEntityException when session is already finalised', async () => {
    const service = makeService({
      session: {
        findUnique: jest.fn().mockResolvedValue({ id: 's-1', userId: 'user-1', status: 'FINALISED', findings: [] }),
        update: jest.fn(),
      },
    });
    await expect(service.finalise(mockUser, 's-1')).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws ConflictException when pending findings remain', async () => {
    const service = makeService({
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's-1',
          userId: 'user-1',
          status: 'IN_REVIEW',
          findings: [{ id: 'f-1' }, { id: 'f-2' }],
        }),
        update: jest.fn(),
      },
    });
    const error = await service.finalise(mockUser, 's-1').catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({ pendingCount: 2 });
  });

  it('finalises successfully when all findings are decided', async () => {
    const finalised = { id: 's-1', status: 'FINALISED', finalisedAt: new Date() };
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue({ id: 's-1', userId: 'user-1', status: 'IN_REVIEW', findings: [] }),
        update: jest.fn(),
      },
      finding: { findMany: jest.fn().mockResolvedValue([{ reviewStatus: 'accepted' }]) },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        const tx = { session: { update: jest.fn().mockResolvedValue(finalised) }, auditLogEntry: { create: jest.fn() } };
        return cb(tx);
      }),
    } as any;
    const service = new SessionsService(prisma, { log: jest.fn() } as any);
    const result = await service.finalise(mockUser, 's-1');
    expect(result.status).toBe('FINALISED');
  });
});
