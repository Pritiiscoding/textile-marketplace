import { sendEmail } from "./email.js";
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f7fa;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🧵 ThreadLoom</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">B2B Textile Marketplace</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">Verify your email address</h2>
                <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                  Welcome to ThreadLoom! Click the button below to verify your email and activate your account.
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${verifyUrl}" 
                     style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                    Verify Email Address
                  </a>
                </div>
                <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verifyUrl}" style="color:#3b82f6;word-break:break-all;">${verifyUrl}</a>
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  If you didn't create a ThreadLoom account, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">© 2025 ThreadLoom Marketplace. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  // First try Resend API
  const resendResult = await sendEmail({
    to: email,
    subject: "Verify Your ThreadLoom Account",
    html,
    text: `Welcome to ThreadLoom! Verify your email address by visiting: ${verifyUrl}`
  });

  if (resendResult.success && !resendResult.mocked) {
    console.log(`[sendEmail] Verification email sent successfully to ${email} via Resend`);
    return { sent: true, verifyUrl, provider: "resend" };
  }

  // Next try SMTP if credentials exist
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"ThreadLoom Marketplace" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify Your ThreadLoom Account",
        html,
      });

      console.log(`[sendEmail] Verification email sent successfully to ${email} via SMTP`);
      return { sent: true, verifyUrl, provider: "smtp" };
    } catch (error) {
      console.error("[sendEmail] Error sending verification email via SMTP:", error.message);
    }
  }

  console.log(`[sendEmail] DEV verify link for ${email}: ${verifyUrl}`);
  return { sent: false, verifyUrl, mocked: true };
};

