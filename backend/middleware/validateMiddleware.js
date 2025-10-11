const { validationResult, body, param, query } = require('express-validator');

// Generic validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Footprint validation rules
const validateFootprintLog = [
  body('category')
    .isIn(['transport', 'energy', 'food', 'travel', 'shopping'])
    .withMessage('Invalid category'),
  
  body('activity')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity description is required'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('unit')
    .isIn(['km', 'kwh', 'kg', 'liters', 'hours'])
    .withMessage('Invalid unit'),
  
  handleValidationErrors
];

// Water usage validation rules
const validateWaterLog = [
  body('category')
    .isIn(['shower', 'dishes', 'laundry', 'garden', 'drinking', 'other'])
    .withMessage('Invalid water usage category'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('unit')
    .isIn(['liters', 'gallons'])
    .withMessage('Invalid unit'),
  
  handleValidationErrors
];

// Recyclable validation rules
const validateRecyclable = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn(['electronics', 'clothing', 'furniture', 'books', 'toys', 'appliances', 'other'])
    .withMessage('Invalid category'),
  
  body('condition')
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City is required'),
  
  handleValidationErrors
];

// Donation validation rules
const validateDonation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn(['food', 'clothing', 'books', 'toys', 'household', 'medical', 'other'])
    .withMessage('Invalid category'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address is required'),
  
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City is required'),
  
  handleValidationErrors
];

// Awareness post validation rules
const validateAwarenessPost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Content must be between 50 and 2000 characters'),
  
  body('category')
    .isIn(['tips', 'news', 'education', 'events', 'challenges'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  handleValidationErrors
];

// ID parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateFootprintLog,
  validateWaterLog,
  validateRecyclable,
  validateDonation,
  validateAwarenessPost,
  validateObjectId,
  validatePagination
};