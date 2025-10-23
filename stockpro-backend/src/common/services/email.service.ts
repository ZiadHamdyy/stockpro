import { Injectable } from '@nestjs/common';
import type { IMailService } from './mail.interface';
import { MailOptions } from './mail.interface';

@Injectable()
export class EmailService {
  constructor(private readonly mailService: IMailService) {}

  async sendOtpEmail(
    email: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in ${expiryMinutes} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Please use the following OTP to complete the process:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in ${expiryMinutes} minutes.</strong></p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    };

    await this.mailService.sendMail(mailOptions);
  }

  async sendEmailVerificationOtp(
    email: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<void> {
    const mailOptions: MailOptions = {
      to: email,
      subject: 'Email Verification - StockPro Platform',
      text: `Your OTP for email verification is: ${otp}. This OTP will expire in ${expiryMinutes} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to StockPro Platform!</h2>
          <p>Thank you for signing up. Please verify your email address using the OTP below:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in ${expiryMinutes} minutes.</strong></p>
          <p>If you did not create an account, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    };

    await this.mailService.sendMail(mailOptions);
  }

  async sendMail(options: MailOptions): Promise<void> {
    await this.mailService.sendMail(options);
  }
}
