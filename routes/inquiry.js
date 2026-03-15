const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendInquiryEmail } = require('../services/mailer');

// Validation middleware
const inquiryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .isLength({ min: 10, max: 20 }).withMessage('Phone must be between 10-20 characters')
    .matches(/^[+\d\s\-()]+$/).withMessage('Phone contains invalid characters'),
  
  body('service')
    .trim()
    .notEmpty().withMessage('Service selection is required')
    .isLength({ min: 2, max: 100 }).withMessage('Service must be between 2-100 characters'),
  
  body('eventType')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Event type too long'),
  
  body('eventDate')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Event date too long'),
  
  body('guestCount')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Guest count too long'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location too long'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters')
];

router.post('/api/inquiry', inquiryValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
      });
    }

    const { name, email, phone, service, eventType, eventDate, guestCount, location, message } = req.body;

    // Prepare inquiry data
    const inquiryData = {
      name,
      email,
      phone,
      service,
      eventType: eventType || 'Not specified',
      eventDate: eventDate || 'Not specified',
      guestCount: guestCount || 'Not specified',
      location: location || 'Not specified',
      message: message || ''
    };

    // Send email
    await sendInquiryEmail(inquiryData);

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Inquiry received successfully. We will contact you soon!'
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process inquiry. Please try again later.'
    });
  }
});

module.exports = router;
