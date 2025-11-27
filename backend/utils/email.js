const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter object using the default SMTP transport
 */
const createTransporter = () => {
  // Check if required email environment variables are set
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('SMTP configuration missing. Please set SMTP_EMAIL and SMTP_PASSWORD in environment variables.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} verificationCode - The verification code to send
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = createTransporter();
    
    // Check if transporter is properly configured
    if (!transporter) {
      console.error('Email transporter not configured. Missing SMTP credentials.');
      return false;
    }

    // Define email options
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL,
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

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
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
    const transporter = createTransporter();
    
    // Check if transporter is properly configured
    if (!transporter) {
      console.error('Email transporter not configured. Missing SMTP credentials.');
      return false;
    }

    // Define email options
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL,
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

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification reminder email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification reminder email:', error);
    return false;
  }
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetUrl - The password reset URL to send
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    // Check if transporter is properly configured
    if (!transporter) {
      console.error('Email transporter not configured. Missing SMTP credentials.');
      return false;
    }

    // Define email options
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL,
      to: email,
      subject: 'Password Reset Request - PinQuest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your PinQuest account.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 15px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; margin: 15px 0;">
            <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
          </p>
          <p>This link will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 0.9em;">© ${new Date().getFullYear()} PinQuest. All rights reserved.</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendVerificationReminderEmail,
  sendPasswordResetEmail,
};