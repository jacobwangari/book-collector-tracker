const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use host/port for other providers
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password, not your real password
    }
});

async function sendVerificationEmail(toEmail, username, token) {
    const verifyUrl = `${process.env.APP_URL}/auth/verify/${token}`;

    await transporter.sendMail({
        from: `"BookTrack" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Verify your BookTrack account',
        html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #8B4513;">Welcome to BookTrack, ${username}!</h2>
                <p>Please verify your email address to activate your account.</p>
                <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 6px;">
                    Verify Email
                </a>
                <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                    This link expires in 24 hours. If you didn't create this account, ignore this email.
                </p>
            </div>
        `
    });
}

async function sendPasswordResetEmail(toEmail, username, token) {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${token}`;

    await transporter.sendMail({
        from: `"BookTrack" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset your BookTrack password',
        html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #8B4513;">Password Reset Request</h2>
                <p>Hi ${username}, click below to reset your password.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 6px;">
                    Reset Password
                </a>
                <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                    This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `
    });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

