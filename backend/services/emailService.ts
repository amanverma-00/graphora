import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailContext {
    [key: string]: string | number | boolean | undefined;
}

interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;
    private isReady: boolean = false;

    constructor() {
        const smtpConfig: SMTPConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        };

        this.transporter = nodemailer.createTransport(smtpConfig);

        this.transporter.verify((error: Error | null) => {
            if (error) {
                console.error('SMTP Connection Error:', error);
                this.isReady = false;
            } else {
                console.log('✓ SMTP Server is ready to take messages');
                this.isReady = true;
            }
        });
    }

    private async sendEmail(
        to: string,
        subject: string,
        templateName: string,
        context: EmailContext
    ): Promise<EmailResult> {
        try {
            const templatePath = path.join(__dirname, '../emails', `${templateName}.hbs`);

            if (!fs.existsSync(templatePath)) {
                console.error(`Email template not found: ${templatePath}`);
                return { success: false, error: 'Email template not found' };
            }

            const templateSource = fs.readFileSync(templatePath, 'utf8');
            const template = Handlebars.compile(templateSource);
            const html = template(context);

            const mailOptions = {
                from: `"Graphora" <${process.env.EMAIL_FROM || 'noreply@graphora.com'}>`,
                to,
                subject,
                html,
                text: this.htmlToText(html)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✓ Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`✗ Error sending email to ${to}:`, errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    private htmlToText(html: string): string {
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async sendOTP(email: string, otp: string, name: string): Promise<EmailResult> {
        const context: EmailContext = {
            name,
            otp,
            expiryMinutes: 10,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@graphora.com'
        };

        return this.sendEmail(email, 'Your OTP Code - Graphora', 'otp', context);
    }

    async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const context: EmailContext = {
            name,
            loginUrl: `${frontendUrl}/login`,
            dashboardUrl: `${frontendUrl}/dashboard`,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@graphora.com'
        };

        return this.sendEmail(email, 'Welcome to Graphora!', 'welcome', context);
    }

    async sendPasswordResetEmail(
        email: string,
        name: string,
        resetToken: string
    ): Promise<EmailResult> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const context: EmailContext = {
            name,
            resetUrl: `${frontendUrl}/reset-password/${resetToken}`,
            expiryHours: 1,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@graphora.com'
        };

        return this.sendEmail(email, 'Password Reset Request', 'password-reset', context);
    }

    async sendPasswordChangedEmail(email: string, name: string): Promise<EmailResult> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const context: EmailContext = {
            name,
            loginUrl: `${frontendUrl}/login`,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@graphora.com'
        };

        return this.sendEmail(email, 'Password Changed Successfully', 'password-changed', context);
    }

    isConfigured(): boolean {
        return this.isReady;
    }
}

const emailService = new EmailService();

export default emailService;
export { EmailService, EmailResult };