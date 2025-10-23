export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IMailService {
  sendMail(options: MailOptions): Promise<void>;
}

