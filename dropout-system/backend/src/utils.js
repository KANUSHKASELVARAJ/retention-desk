export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Column name -> key. MUST match snake() in ml-service/train.py */
export const snakeKey = (name) => name.trim().toLowerCase().replace(/[^0-9a-z]+/g, '_').replace(/^_+|_+$/g, '');

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
