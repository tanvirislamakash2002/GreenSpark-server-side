import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";
import { bearer } from "better-auth/plugins";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD,
    },
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        bearer(),
    ],
    baseURL: process.env.BETTER_AUTH_URL ||"https://greenspark-server.vercel.app",
    trustedOrigins: [
        "http://localhost:3000",
        "https://greenspark.vercel.app",
        "https://greenspark-server.vercel.app",
        "https://greenspark.vercel.app/api/auth/callback/google",
    ],
    cookie: {
        name: "better-auth",
        attributes: {
            sameSite: "none",
            secure: process.env.NODE_ENV === "production",
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "MEMBER",  
                required: true,
            },
            phone: {
                type: "string",
                required: false,
            },
            address: {
                type: "string",
                required: false,
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
    },
    emailVerification: {
        sendOnSignUp: false,
        autoSignInAfterVerification: false,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            try {
                const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
                await transporter.sendMail({
                    from: '"GreenSpark" <greenspark.support@gmail.com>',
                    to: user.email,
                    subject: "Verify Your Email - GreenSpark",
                    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - GreenSpark</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #15803d 0%, #166534 100%); border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🌿 GreenSpark</h1>
                <p style="color: #bbf7d0; margin: 5px 0 0; font-size: 16px;">Igniting Sustainable Ideas</p>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #166534; margin: 0 0 20px; font-size: 24px;">Verify Your Email Address</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px;">Hello ${user.name},</p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px;">Thank you for joining <strong style="color: #15803d;">GreenSpark</strong>! To complete your registration and start sharing sustainable ideas, please verify your email address by clicking the button below:</p>
                
                <!-- Verification Button -->
                <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                        <td style="background: #15803d; border-radius: 50px; text-align: center; box-shadow: 0 4px 15px rgba(21, 128, 61, 0.4);">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">Verify Email Address</a>
                        </td>
                    </tr>
                </table>
                
                <!-- Alternative Link -->
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px;">Or copy and paste this link into your browser:</p>
                <p style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #15803d; word-break: break-all; margin: 0 0 20px;">
                    <a href="${verificationUrl}" style="color: #15803d; text-decoration: none; font-size: 14px;">${verificationUrl}</a>
                </p>
                
                <!-- Expiry Notice -->
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>⚠️ Link Expires in 24 Hours</strong><br>
                        This verification link will expire in 24 hours for security reasons.
                    </p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0;">If you didn't create an account with GreenSpark, you can safely ignore this email.</p>
            </td>
        </tr>
        
        <!-- Benefits Section -->
        <tr>
            <td style="padding: 0 40px 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="border-top: 1px solid #dcfce7; padding-top: 25px;">
                            <h3 style="color: #166534; margin: 0 0 20px; font-size: 18px; text-align: center;">What you can do with GreenSpark:</h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #dcfce7; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">💡</div>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">Share Ideas</p>
                                    </td>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #dcfce7; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">👍</div>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">Vote & Support</p>
                                    </td>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #dcfce7; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">🌍</div>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">Make Impact</p>
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
            <td style="background-color: #1a3a2a; padding: 30px 40px; border-radius: 0 0 10px 10px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center;">
                            <p style="color: #86efac; margin: 0 0 10px; font-size: 14px;">© 2026 GreenSpark. All rights reserved.</p>
                            <p style="color: #86efac; margin: 0 0 15px; font-size: 14px;">Building a sustainable future, one idea at a time.</p>
                            
                            <!-- Social Links -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #bbf7d0; text-decoration: none; font-size: 14px;">Facebook</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #bbf7d0; text-decoration: none; font-size: 14px;">Twitter</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #bbf7d0; text-decoration: none; font-size: 14px;">Instagram</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6ee7b7; margin: 0; font-size: 12px;">This email was sent to ${user.email}. If you didn't create an account, please ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
                });
            } catch (error) {
                console.error("Email verification error:", error);
                throw error;
            }
        },
    },
    socialProviders: {
        google: {
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: process.env.NODE_ENV === "production",
        crossSubDomainCookies: {
            enabled: false,
        },
        disableCSRFCheck: true,
    },
});