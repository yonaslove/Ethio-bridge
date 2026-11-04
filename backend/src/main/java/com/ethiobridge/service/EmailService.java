package com.ethiobridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@ethiobridge.et}")
    private String fromEmail;

    public void sendWelcomeEmail(String toEmail, String fullName) {
        String subject = "Welcome to EthioBridge";
        String body = "Hello " + fullName + ",\n\nWelcome to EthioBridge - Ethiopia's trusted marketplace connecting talent and businesses.";
        dispatchEmail(toEmail, subject, body);
    }

    public void sendMilestoneFundedEmail(String toEmail, String milestoneTitle, BigDecimal amount) {
        String subject = "Milestone Escrow Funded";
        String body = "Milestone '" + milestoneTitle + "' with amount " + amount + " ETB has been funded in escrow. Work may now commence.";
        dispatchEmail(toEmail, subject, body);
    }

    public void sendPaymentReleasedEmail(String toEmail, String milestoneTitle, BigDecimal netAmount) {
        String subject = "Escrow Payout Released";
        String body = "Payment of " + netAmount + " ETB for milestone '" + milestoneTitle + "' has been transferred to your account/wallet.";
        dispatchEmail(toEmail, subject, body);
    }

    public void sendMilestoneRefundedEmail(String toEmail, String milestoneTitle, BigDecimal amount, String reason) {
        String subject = "Milestone Escrow Refund Processed";
        String body = "Escrow deposit of " + amount + " ETB for milestone '" + milestoneTitle + "' has been refunded to your account.\nReason: " + reason;
        dispatchEmail(toEmail, subject, body);
    }

    public void sendDisputeAlertEmail(String toEmail, String contractTitle, String reason) {
        String subject = "Urgent: Dispute Opened";
        String body = "A formal dispute has been opened regarding contract '" + contractTitle + "'. Reason: " + reason + ". Our arbitration team is reviewing the case.";
        dispatchEmail(toEmail, subject, body);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "Reset Your EthioBridge Password";
        String body = "You requested a password reset. Click the link below to set a new password:\n" + resetLink + "\n\nLink expires in 15 minutes. If you did not request this, ignore this email.";
        dispatchEmail(toEmail, subject, body);
    }

    private void dispatchEmail(String toEmail, String subject, String body) {
        if (mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail);
                msg.setTo(toEmail);
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
                log.info("[SMTP MAIL SENT] To: {} | Subject: {}", toEmail, subject);
                return;
            } catch (Exception ex) {
                log.warn("SMTP mail delivery failed, falling back to log: {}", ex.getMessage());
            }
        }

        // Transactional log fallback (when mail host is not configured)
        log.info("[EMAIL DISPATCHED] To: {} | Subject: {} | Body: {}", toEmail, subject, body.replace("\n", " "));
    }
}
