

import nodemailer from 'nodemailer';

// Create transporter with SMTP config from env
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false,
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
  // Split OTP into individual digits for better display
  const otpDigits = otp.split('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your DocLoq Verification Code</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    /* Responsive styles */
    @media only screen and (max-width: 480px) {
      .mobile-padding {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .otp-digit {
        width: 40px !important;
        height: 50px !important;
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Wrapper Table -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;" class="mobile-padding">
        <!-- Content Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right: 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="48" height="48" style="background-color: #8b5cf6; border-radius: 12px;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 24px; font-weight: bold; color: #ffffff;">D</td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle">
                    <span style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">DocLoq</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 20px; border: 1px solid #334155;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                
                <!-- Icon Section -->
                <tr>
                  <td align="center" style="padding: 40px 32px 24px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="80" height="80" style="background-color: #8b5cf6; border-radius: 20px;">
                      <tr>
                        <td align="center" valign="middle">
                          <!-- Shield/Lock Icon using HTML entities -->
                          <span style="font-size: 36px;">🔐</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title -->
                <tr>
                  <td align="center" style="padding: 0 32px 8px 32px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Verification Code</h1>
                  </td>
                </tr>
                
                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding: 0 32px 28px 32px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 16px; line-height: 1.5;">
                      Hi${userName ? ` <strong style="color: #e2e8f0;">${userName}</strong>` : ''}, use this code to verify your login
                    </p>
                  </td>
                </tr>
                
                <!-- OTP Code Box -->
                <tr>
                  <td align="center" style="padding: 0 32px 28px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #312e81; border: 2px solid #6366f1; border-radius: 16px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              ${otpDigits.map(digit => `
                              <td align="center" style="padding: 0 6px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="otp-digit" width="48" height="60" style="background-color: #1e1b4b; border-radius: 10px;">
                                  <tr>
                                    <td align="center" valign="middle" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; color: #c7d2fe;">${digit}</td>
                                  </tr>
                                </table>
                              </td>
                              `).join('')}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Timer Warning -->
                <tr>
                  <td align="center" style="padding: 0 32px 24px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #422006; border: 1px solid #854d0e; border-radius: 12px;">
                      <tr>
                        <td style="padding: 14px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="middle" style="padding-right: 10px;">
                                <span style="font-size: 18px;">⏱️</span>
                              </td>
                              <td valign="middle">
                                <span style="color: #fbbf24; font-size: 14px; font-weight: 600;">This code expires in ${OTP_EXPIRY_MINUTES} minutes</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Security Notice -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #450a0a; border: 1px solid #7f1d1d; border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 18px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td valign="top" width="32" style="padding-right: 12px;">
                                <span style="font-size: 20px;">⚠️</span>
                              </td>
                              <td valign="top">
                                <p style="margin: 0 0 4px 0; color: #fca5a5; font-size: 14px; font-weight: 600;">Security Notice</p>
                                <p style="margin: 0; color: #f87171; font-size: 13px; line-height: 1.5;">Never share this code with anyone. DocLoq will never ask for your verification code via phone or email.</p>
                              </td>
                            </tr>
                          </table>
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
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                If you didn't request this code, please ignore this email<br>or contact our support team.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px;">Help Center</a>
                  </td>
                  <td style="color: #475569;">•</td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                  </td>
                  <td style="color: #475569;">•</td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px;">Terms of Service</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; color: #475569; font-size: 12px;">
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
      subject: `Your DocLoq verification code`,
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
