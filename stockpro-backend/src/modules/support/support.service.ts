import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { EmailService } from '../../common/services/email.service';
import { CreateSupportTicketDto } from './dtos/create-support-ticket.dto';
import type { currentUserType } from '../../common/types/current-user.type';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async createSupportTicket(
    companyId: string,
    user: currentUserType,
    createSupportTicketDto: CreateSupportTicketDto,
  ): Promise<void> {
    // Get company information
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    const companyName = company?.name || 'Unknown Company';

    // Extract branch name from user
    const branchName = user.branch?.name || 'غير محدد';

    // Extract user information
    const userName = user.name || 'غير محدد';
    const userEmail = user.email || 'غير محدد';

    // Format email subject
    const subject = `تذكرة دعم من ${companyName} - ${createSupportTicketDto.title}`;

    // Format email body (HTML)
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px;">
            تذكرة دعم جديدة
          </h2>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0;">معلومات المستخدم</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">الاسم:</td>
                <td style="padding: 8px; color: #1f2937;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">البريد الإلكتروني:</td>
                <td style="padding: 8px; color: #1f2937;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">الشركة:</td>
                <td style="padding: 8px; color: #1f2937;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">الفرع:</td>
                <td style="padding: 8px; color: #1f2937;">${branchName}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-top: 0;">تفاصيل التذكرة</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">الاسم:</td>
                <td style="padding: 8px; color: #1f2937;">${this.escapeHtml(createSupportTicketDto.name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">رقم الهاتف:</td>
                <td style="padding: 8px; color: #1f2937;">${this.escapeHtml(createSupportTicketDto.phone)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">نوع المشكلة:</td>
                <td style="padding: 8px; color: #1f2937;">${this.escapeHtml(createSupportTicketDto.problemType)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">عنوان المشكلة:</td>
                <td style="padding: 8px; color: #1f2937;">${this.escapeHtml(createSupportTicketDto.title)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">التفاصيل:</h3>
            <p style="color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${this.escapeHtml(createSupportTicketDto.details)}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>تم إرسال هذه التذكرة من نظام StockPro</p>
            <p>التاريخ والوقت: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</p>
          </div>
        </div>
      </div>
    `;

    // Format plain text version
    const text = `
تذكرة دعم جديدة

معلومات المستخدم:
- الاسم: ${userName}
- البريد الإلكتروني: ${userEmail}
- الشركة: ${companyName}
- الفرع: ${branchName}

تفاصيل التذكرة:
- الاسم: ${createSupportTicketDto.name}
- رقم الهاتف: ${createSupportTicketDto.phone}
- نوع المشكلة: ${createSupportTicketDto.problemType}
- عنوان المشكلة: ${createSupportTicketDto.title}

التفاصيل:
${createSupportTicketDto.details}

---
تم إرسال هذه التذكرة من نظام StockPro
التاريخ والوقت: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
    `;

    // Send email to support
    await this.emailService.sendMail({
      to: 'stock.pro83@gmail.com',
      subject,
      text,
      html,
    });
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

