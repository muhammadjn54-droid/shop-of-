import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureMainBranch(userId: number) {
    let branch = await this.prisma.branch.findFirst({
      where: { userId, isMain: true },
    });
    if (branch) return branch;

    branch = await this.prisma.branch.findFirst({ where: { userId }, orderBy: { id: 'asc' } });
    if (branch) {
      return this.prisma.branch.update({ where: { id: branch.id }, data: { isMain: true } });
    }

    return this.prisma.branch.create({
      data: {
        userId,
        name: 'Основной филиал',
        isMain: true,
      },
    });
  }

  async resolveBranchId(userId: number, branchId?: number | null): Promise<number> {
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({ where: { id: branchId, userId } });
      if (branch) return branch.id;
    }
    const main = await this.ensureMainBranch(userId);
    return main.id;
  }

  async list(userId: number) {
    await this.ensureMainBranch(userId);
    return this.prisma.branch.findMany({
      where: { userId },
      orderBy: [{ isMain: 'desc' }, { id: 'asc' }],
    });
  }
}
