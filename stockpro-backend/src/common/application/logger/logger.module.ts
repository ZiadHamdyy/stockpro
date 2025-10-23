import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Module, Global } from '@nestjs/common';
import { createWriteStream } from 'pino-sentry';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          pinoHttp: [
            {
              name: 'Pino',
              level: config.get('NODE_ENV') !== 'production' ? 'warn' : 'info',
              timestamp: () => `, "Time": "${new Date().toISOString()}"`,
              redact: ['password', 'headers.cookie'],
              safe: true,
              enabled: config.get('NODE_ENV') !== 'test',
              ...(config.get('NODE_ENV') !== 'production' && {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    crlf: true,
                  },
                },
              }),
              serializers: {
                err: pino.stdSerializers.err,
                req: pino.stdSerializers.req,
                res: pino.stdSerializers.res,
              },
              useLevel:
                config.get('NODE_ENV') !== 'production' ? 'debug' : 'info',
              genReqId: (req) => req.id || randomUUID(),
              autoLogging: false,
              ...(config.get('NODE_ENV') === 'production' && {
                logger: pino(
                  { level: 'debug' },
                  pino.multistream([
                    { stream: process.stdout },
                    {
                      stream: fs.createWriteStream(
                        path.join(process.cwd(), 'logs/logs.out'),
                      ),
                    },
                    {
                      stream: createWriteStream({
                        dsn: config.get('SENTRY_DNS'),
                        serverName: config.get('SERVER_NAME'),
                      }),
                    },
                  ]),
                ),
              }),
            },
            process.stdout,
          ],
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
