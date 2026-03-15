const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error.message);
  } else {
    console.log('Email service verified and ready to send');
  }
});

const sendInquiryEmail = async (inquiryData) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromName = process.env.EMAIL_FROM_NAME || 'Style Fair Events';
    
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
              New Event Inquiry - ${escapeHtml(inquiryData.service)}
            </h2>
            
            <div style="margin-top: 20px;">
              <p><strong>Full Name:</strong> ${escapeHtml(inquiryData.name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(inquiryData.email)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(inquiryData.phone)}</p>
              <p><strong>Service Interested In:</strong> ${escapeHtml(inquiryData.service)}</p>
              <p><strong>Event Type:</strong> ${escapeHtml(inquiryData.eventType)}</p>
              <p><strong>Event Date:</strong> ${escapeHtml(inquiryData.eventDate)}</p>
              <p><strong>Guest Count:</strong> ${escapeHtml(inquiryData.guestCount)}</p>
              <p><strong>Location:</strong> ${escapeHtml(inquiryData.location)}</p>
              <p><strong>Additional Details:</strong></p>
              <p style="background-color: #fff; padding: 10px; border-left: 4px solid #d4af37;">
                ${escapeHtml(inquiryData.message || 'No additional details provided')}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This inquiry was received from the Style Fair Events website.</p>
              <p>Reply to: ${escapeHtml(inquiryData.email)}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: inquiryData.email,
      subject: `New Event Inquiry - ${inquiryData.service}`,
      html: emailBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Inquiry email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send inquiry email');
  }
};

// Utility function to escape HTML special characters
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

module.exports = { sendInquiryEmail };
