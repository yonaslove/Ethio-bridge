package com.ethiobridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    public void sendWelcomeEmail(String toEmail, String fullName) {
        log.info("[EMAIL DISPATCHED] To: {} | Subject: Welcome to EthioBridge | Body: Hello {}, welcome to Ethiopia's trusted talent & local services marketplace.",
                toEmail, fullName);
    }

    public void sendMilestoneFundedEmail(String toEmail, String milestoneTitle, BigDecimal amount) {
        log.info("[EMAIL DISPATCHED] To: {} | Subject: Milestone Escrow Funded | Body: Milestone '{}' with amount {} ETB has been funded in escrow. Work may now commence.",
                toEmail, milestoneTitle, amount);
    }

    public void sendPaymentReleasedEmail(String toEmail, String milestoneTitle, BigDecimal netAmount) {
        log.info("[EMAIL DISPATCHED] To: {} | Subject: Escrow Payout Released | Body: Payment of {} ETB for milestone '{}' has been transferred to your Telebirr wallet.",
                toEmail, netAmount, milestoneTitle);
    }

    public void sendDisputeAlertEmail(String toEmail, String contractTitle, String reason) {
        log.info("[EMAIL DISPATCHED] To: {} | Subject: Urgent: Dispute Opened | Body: A formal dispute has been opened regarding contract '{}'. Reason: {}. Our arbitration team is reviewing the case.",
                toEmail, contractTitle, reason);
    }
}
