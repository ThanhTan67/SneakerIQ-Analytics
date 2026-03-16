package com.example.backend.service;

import com.example.backend.exception.EmailException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.base-url}")
    private String baseUrl;

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    /**
     * Send OTP email (Async)
     */
    @Override
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendPasswordResetOTP(
            String to,
            String otp,
            int expiryMinutes,
            String userName
    ) {

        long start = System.currentTimeMillis();
        String messageId = generateMessageId(to);

        try {

            log.info("📧 [{}] Sending OTP email to {}", messageId, to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject("🔐 Password Reset Verification Code");

            message.setHeader("X-Message-ID", messageId);

            String html = buildOTPTemplate(
                    userName,
                    otp,
                    expiryMinutes
            );

            helper.setText(html, true);

            mailSender.send(message);

            long duration = System.currentTimeMillis() - start;

            log.info("✅ [{}] OTP email sent in {} ms", messageId, duration);

            return CompletableFuture.completedFuture(true);

        } catch (Exception e) {

            log.error("❌ [{}] Failed to send OTP email", messageId, e);

            return CompletableFuture.failedFuture(
                    new EmailException("Failed to send OTP email", e)
            );
        }
    }

    /**
     * Send confirmation email
     */
    @Override
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendPasswordResetConfirmation(
            String to,
            String userName
    ) {

        String messageId = generateMessageId(to);

        try {

            log.info("📧 [{}] Sending confirmation email to {}", messageId, to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject("✅ Password Reset Successful");

            String html = buildConfirmationTemplate(userName);

            helper.setText(html, true);

            mailSender.send(message);

            log.info("✅ [{}] Confirmation email sent", messageId);

            return CompletableFuture.completedFuture(true);

        } catch (Exception e) {

            log.error("❌ [{}] Failed to send confirmation email", messageId, e);

            return CompletableFuture.failedFuture(
                    new EmailException("Failed to send confirmation email", e)
            );
        }
    }

    /**
     * Sync version
     */
    @Override
    public boolean sendPasswordResetOTPSync(
            String to,
            String otp,
            int expiryMinutes,
            String userName
    ) {

        try {

            return sendPasswordResetOTP(
                    to,
                    otp,
                    expiryMinutes,
                    userName
            ).get();

        } catch (Exception e) {

            log.error("Failed to send OTP email synchronously", e);

            return false;
        }
    }

    /**
     * OTP Email Template
     */
    private String buildOTPTemplate(
            String userName,
            String otp,
            int expiryMinutes
    ) {

        String displayName =
                (userName == null || userName.isEmpty())
                        ? "User"
                        : userName;

        return OTP_TEMPLATE
                .replace("{{name}}", displayName)
                .replace("{{otp}}", otp)
                .replace("{{expiry}}", String.valueOf(expiryMinutes))
                .replace("{{year}}", String.valueOf(LocalDateTime.now().getYear()))
                .replace("{{time}}", LocalDateTime.now().format(TIME_FORMAT))
                .replace("{{app}}", fromName);
    }

    /**
     * Confirmation Template
     */
    private String buildConfirmationTemplate(String userName) {

        String displayName =
                (userName == null || userName.isEmpty())
                        ? "User"
                        : userName;

        return CONFIRM_TEMPLATE
                .replace("{{name}}", displayName)
                .replace("{{year}}", String.valueOf(LocalDateTime.now().getYear()))
                .replace("{{time}}", LocalDateTime.now().format(TIME_FORMAT))
                .replace("{{loginUrl}}", baseUrl + "/login")
                .replace("{{app}}", fromName);
    }

    /**
     * Generate email id
     */
    private String generateMessageId(String email) {

        return System.currentTimeMillis() +
                "-" +
                Integer.toHexString(email.hashCode());
    }

    /**
     * OTP HTML TEMPLATE
     */
    private static final String OTP_TEMPLATE = """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
            <style>
            body{
            font-family:Arial;
            background:#f4f6fb;
            padding:20px;
            }
            
            .container{
            max-width:600px;
            margin:auto;
            background:white;
            border-radius:16px;
            padding:30px;
            box-shadow:0 10px 30px rgba(0,0,0,0.1);
            }
            
            .header{
            text-align:center;
            font-size:24px;
            font-weight:600;
            margin-bottom:20px;
            }
            
            .otp{
            font-size:40px;
            font-weight:bold;
            letter-spacing:8px;
            text-align:center;
            margin:30px 0;
            color:#4f46e5;
            }
            
            .info{
            background:#f1f5f9;
            padding:15px;
            border-radius:10px;
            }
            
            .footer{
            margin-top:30px;
            font-size:12px;
            color:#777;
            text-align:center;
            }
            </style>
            </head>
            
            <body>
            
            <div class="container">
            
            <div class="header">
            🔐 Password Reset
            </div>
            
            <p>Hello <b>{{name}}</b>,</p>
            
            <p>Use the verification code below to reset your password:</p>
            
            <div class="otp">
            {{otp}}
            </div>
            
            <div class="info">
            This code expires in <b>{{expiry}} minutes</b>
            </div>
            
            <div class="footer">
            © {{year}} {{app}} <br>
            Sent at {{time}}
            </div>
            
            </div>
            
            </body>
            </html>
            """;

    /**
     * CONFIRMATION HTML TEMPLATE
     */
    private static final String CONFIRM_TEMPLATE = """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <title>Password Reset Successful</title>
            
            <style>
            
            body{
            font-family:Arial;
            background:#f4f6fb;
            padding:20px;
            }
            
            .container{
            max-width:600px;
            margin:auto;
            background:white;
            border-radius:16px;
            padding:30px;
            box-shadow:0 10px 30px rgba(0,0,0,0.1);
            text-align:center;
            }
            
            .success{
            font-size:50px;
            }
            
            .button{
            display:inline-block;
            margin-top:20px;
            padding:12px 25px;
            background:#10b981;
            color:white;
            text-decoration:none;
            border-radius:30px;
            }
            
            .footer{
            margin-top:30px;
            font-size:12px;
            color:#777;
            }
            
            </style>
            
            </head>
            
            <body>
            
            <div class="container">
            
            <div class="success">
            🎉
            </div>
            
            <h2>Hello {{name}}</h2>
            
            <p>Your password has been reset successfully.</p>
            
            <a href="{{loginUrl}}" class="button">
            Login Now
            </a>
            
            <div class="footer">
            © {{year}} {{app}} <br>
            Confirmed at {{time}}
            </div>
            
            </div>
            
            </body>
            </html>
            """;
}