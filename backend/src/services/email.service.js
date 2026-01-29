// Email Service - SMTP via Brevo

import nodemailer from 'nodemailer';

// Create transporter with SMTP config from env
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP expiry time (5 minutes)
export const OTP_EXPIRY_MINUTES = 5;

// Email template for OTP
const generateOTPEmailHTML = (otp, userName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DocLoq Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px; font-weight: bold;">D</span>
                </div>
                <span style="font-size: 28px; font-weight: bold; color: white;">DocLoq</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(145deg, #1e293b, #0f172a); border-radius: 24px; border: 1px solid #334155; padding: 40px 32px;">
              <!-- Icon -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
                
                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Verification Code</h1>
                  </td>
                </tr>
                
                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 15px;">
                      Hi${userName ? ` ${userName}` : ''}, use this code to verify your login
                    </p>
                  </td>
                </tr>
                
                <!-- OTP Code -->
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="background: linear-gradient(135deg, #312e81, #1e1b4b); border: 2px solid #4f46e5; border-radius: 16px; padding: 24px 32px; display: inline-block;">
                      <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a5b4fc;">${otp}</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Timer Warning -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 12px 20px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span style="color: #fbbf24; font-size: 14px; font-weight: 500;">This code expires in ${OTP_EXPIRY_MINUTES} minutes</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Security Note -->
                <tr>
                  <td style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 24px; vertical-align: top; padding-right: 12px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </td>
                        <td>
                          <p style="margin: 0; color: #f87171; font-size: 13px; font-weight: 500;">Security Notice</p>
                          <p style="margin: 4px 0 0 0; color: #fca5a5; font-size: 12px;">Never share this code with anyone. DocLoq will never ask for your verification code via phone or email.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                If you didn't request this code, please ignore this email<br>or contact our support team.
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                © ${new Date().getFullYear()} DocLoq. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Plain text version
const generateOTPEmailText = (otp, userName) => {
  return `
DocLoq Verification Code

Hi${userName ? ` ${userName}` : ''},

Your verification code is: ${otp}

This code will expire in ${OTP_EXPIRY_MINUTES} minutes.

Security Notice:
- Never share this code with anyone
- DocLoq will never ask for your verification code via phone or email

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} DocLoq. All rights reserved.
  `.trim();
};

// Send OTP Email
export const sendOTPEmail = async (email, otp, userName = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'DocLoq'}" <${process.env.MAIL_FROM_ADDRESS || 'no-reply@docloq.site'}>`,
      to: email,
      subject: `${otp} is your DocLoq verification code`,
      text: generateOTPEmailText(otp, userName),
      html: generateOTPEmailHTML(otp, userName),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('OTP Email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify SMTP connection
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
};

export default {
  generateOTP,
  sendOTPEmail,
  verifyEmailConnection,
  OTP_EXPIRY_MINUTES,
};
