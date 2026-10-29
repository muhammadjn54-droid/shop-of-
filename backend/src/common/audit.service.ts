import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: number;
    userName?: string | null;
    action: string;
    entity: string;
    entityId?: string | number | null;
    details?: unknown;
  }) {
    try {
      let details: string | null = null;
      if (params.details !== undefined && params.details !== null) {
        details =
          typeof params.details === 'string'
            ? params.details
            : JSON.stringify(params.details).slice(0, 4000);
      }
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          userName: params.userName || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId !== undefined && params.entityId !== null ? String(params.entityId) : null,
          details,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed: ${(err as Error).message}`);
    }
  }
}
