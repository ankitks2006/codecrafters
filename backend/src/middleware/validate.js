const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return ApiResponse.badRequest(res, 'Validation failed', errorMessages);
  }
  next();
};

module.exports = validate;
