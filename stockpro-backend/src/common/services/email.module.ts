import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NodemailerMailService } from './nodemailer-mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    NodemailerMailService,
    {
      provide: 'IMailService',
      useClass: NodemailerMailService,
    },
    {
      provide: EmailService,
      useFactory: (mailService: NodemailerMailService) => {
        return new EmailService(mailService);
      },
      inject: [NodemailerMailService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
