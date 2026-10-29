import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { NotificationsService } from './notifications.service';
import { BranchService } from './branch.service';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [AuditService, NotificationsService, BranchService, PermissionsGuard],
  exports: [AuditService, NotificationsService, BranchService, PermissionsGuard],
})
export class CommonModule {}
