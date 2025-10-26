import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly configService: ConfigService) {}

  async createBackup(): Promise<Buffer> {
    // Parse DATABASE_URL
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const username = url.username;
    const database = url.pathname.slice(1); // Remove leading '/'
    const password = url.password;

    // Generate timestamp for filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const filename = `stockpro_backup_${timestamp}.sql`;

    // Build pg_dump command
    const command = `pg_dump --host=${host} --port=${port} --username=${username} --dbname=${database} --no-password --clean --if-exists`;

    this.logger.log(`Creating database backup: ${filename}`);

    try {
      // Execute pg_dump command
      const { stdout } = await execAsync(command, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      this.logger.log(`Backup created successfully: ${filename}`);

      // Convert stdout to Buffer
      return Buffer.from(stdout, 'utf-8');
    } catch (error) {
      this.logger.error('Failed to create backup', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create database backup: ${errorMessage}`);
    }
  }

  getBackupFilename(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `stockpro_backup_${timestamp}.sql`;
  }
}
