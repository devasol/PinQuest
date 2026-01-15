const nodemailer = require('nodemailer');
const logger = require('./logger'); // Import logger for better error tracking

// Helper function to format email 'from' field properly
const formatFromAddress = (email) => {
  if (!email) {
    // Fallback to a default email if none is provided
    return '"PinQuest" <noreply@pinquest.com>';
  }
  return `"PinQuest" <${email}>`;
};

/**
 * Create a reusable transporter object using the default SMTP transport
 */
const createTransporter = async () => {
  // Check if required email environment variables are set
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP configuration missing: SMTP_EMAIL or SMTP_PASSWORD not set. Email functionality will be limited.');
    return null;
  }

  try {
    const isGmail = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail');

    // Create config object
    const config = {
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Set to true in production for security
      },
      connectionTimeout: 30000, // Increased timeout to 30 seconds
      greetingTimeout: 30000,   // Increased timeout to 30 seconds
      socketTimeout: 30000,     // Increased timeout to 30 seconds
    };

    // Use service: 'gmail' for better reliability if host is Gmail
    if (isGmail) {
      config.service = 'gmail';
    } else {
      config.host = process.env.SMTP_HOST || 'smtp.gmail.com';
      config.port = parseInt(process.env.SMTP_PORT) || 587;
      // For port 465, use secure connection; for 587, use STARTTLS
      config.secure = config.port === 465;
    }

    // Create transporter
    const transporter = nodemailer.createTransport(config);

    // Verify transporter configuration asynchronously with timeout
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transporter verification timeout after 30 seconds')), 30000)
        )
      ]);
      console.log('SMTP transporter is ready to send emails');
    } catch (verifyError) {
      console.error('SMTP transporter verification failed:', verifyError.message);
      return null; // Return null if verification fails
    }

    return transporter;
  } catch (error) {
    console.error('Error creating SMTP transporter:', error.message);
    return null;
  }
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} verificationCode - The verification code to send
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = await createTransporter();

    // Check if transporter is properly configured
    if (!transporter) {
      // Fallback: log the verification code to console in development
      console.log(`[EMAIL SIMULATION] Verification code for ${email}: ${verificationCode}`);
      console.log('[EMAIL SIMULATION] In production, this would be sent via email.');
      // Return true to allow the flow to continue in development
      return process.env.NODE_ENV === 'development';
    }

    // Define email options
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL;
    const mailOptions = {
      from: formatFromAddress(fromEmail),
      to: email,
      subject: 'Email Verification Code - PinQuest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Welcome to PinQuest!</h2>
          <p>Hello,</p>
          <p>Thank you for registering with PinQuest. To complete your registration, please use the following verification code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <h1 style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; display: inline-block; letter-spacing: 3px; font-size: 2em;">
              ${verificationCode}
            </h1>
          </div>
          <p>This code will expire in 10 minutes. Enter this code in the verification page to activate your account.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 0.9em;">© ${new Date().getFullYear()} PinQuest. All rights reserved.</p>
        </div>
      `,
    };

    console.log(`Attempting to send verification email to: ${email}`);

    // Set a timeout for the sendMail operation to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });

    // Race between email sending and timeout
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise
    ]);

    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error.message || error);
    return false;
  }
};

/**
 * Send email verification reminder
 * @param {string} email - User's email address
 * @param {string} verificationCode - The verification code to send
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
const sendVerificationReminderEmail = async (email, verificationCode) => {
  try {
    const transporter = await createTransporter();

    // Check if transporter is properly configured
    if (!transporter) {
      // Fallback: log the verification code to console in development
      console.log(`[EMAIL SIMULATION] Verification reminder for ${email}: ${verificationCode}`);
      console.log('[EMAIL SIMULATION] In production, this would be sent via email.');
      // Return true to allow the flow to continue in development
      return process.env.NODE_ENV === 'development';
    }

    // Define email options
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL;
    const mailOptions = {
      from: formatFromAddress(fromEmail),
      to: email,
      subject: 'Verification Code Reminder - PinQuest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Account Verification Reminder</h2>
          <p>Hello,</p>
          <p>You have requested a new verification code for your PinQuest account.</p>
          <p>Your new verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <h1 style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; display: inline-block; letter-spacing: 3px; font-size: 2em;">
              ${verificationCode}
            </h1>
          </div>
          <p>This code will expire in 10 minutes. Enter this code in the verification page to activate your account.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 0.9em;">© ${new Date().getFullYear()} PinQuest. All rights reserved.</p>
        </div>
      `,
    };

    // Set a timeout for the sendMail operation to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });

    // Race between email sending and timeout
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise
    ]);

    console.log('Verification reminder email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification reminder email:', error.message || error);
    return false;
  }
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} otpOrUrl - The password reset OTP or URL to send
 * @param {boolean} isOtp - Whether the content is an OTP or a URL
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
const sendPasswordResetEmail = async (email, otpOrUrl, isOtp = false) => {
  try {
    const transporter = await createTransporter();

    // Check if transporter is properly configured
    if (!transporter) {
      // Fallback: log the OTP to console in development
      console.log(`[EMAIL SIMULATION] Password reset ${isOtp ? 'OTP' : 'URL'} for ${email}: ${otpOrUrl}`);
      console.log('[EMAIL SIMULATION] In production, this would be sent via email.');
      // Return true to allow the flow to continue in development
      return process.env.NODE_ENV === 'development';
    }

    const htmlContent = isOtp ? `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eef2f7; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin-bottom: 8px;">Password Reset</h2>
            <p style="color: #6b7280; font-size: 16px;">Secure your PinQuest account</p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 25px; border: 1px dashed #d1d5db;">
            <p style="color: #374151; font-size: 15px; margin-bottom: 16px; font-weight: 500;">Your verification code is:</p>
            <h1 style="color: #4f46e5; letter-spacing: 6px; font-size: 36px; font-weight: 800; margin: 0;">${otpOrUrl}</h1>
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            <p>This code will expire in <strong>10 minutes</strong>. For security reasons, do not share this code with anyone.</p>
            <p style="margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} PinQuest • Your Adventure Awaits</p>
        </div>
    ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your PinQuest account.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${otpOrUrl}"
               style="display: inline-block; padding: 15px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; margin: 15px 0;">
            <a href="${otpOrUrl}" style="color: #6366f1;">${otpOrUrl}</a>
          </p>
          <p>This link will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 0.9em;">© ${new Date().getFullYear()} PinQuest. All rights reserved.</p>
        </div>
    `;

    // Define email options
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL;
    const mailOptions = {
      from: formatFromAddress(fromEmail),
      to: email,
      subject: isOtp ? 'Your Password Reset OTP - PinQuest' : 'Password Reset Request - PinQuest',
      html: htmlContent,
    };

    console.log(`Attempting to send password reset email (OTP: ${isOtp}) to: ${email}`);

    // Set a timeout for the sendMail operation to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });

    // Race between email sending and timeout
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise
    ]);

    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error.message || error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendVerificationReminderEmail,
  sendPasswordResetEmail,
};