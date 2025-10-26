import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('backup')
@UseGuards(JwtAuthenticationGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('download')
  @Auth({ permissions: ['database_backup:create'] })
  async downloadBackup(@Res() res: Response) {
    try {
      // Create the backup
      const backup = await this.backupService.createBackup();

      // Get filename
      const filename = this.backupService.getBackupFilename();

      // Set response headers
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Send the backup file
      res.send(backup);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Backup failed:', error);
      res.status(500).json({
        error: 'Failed to create backup',
        message: errorMessage,
      });
    }
  }
}
