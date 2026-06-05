class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const notFound = (message = 'Not found') => new AppError(404, message);
const forbidden = (message = 'Forbidden') => new AppError(403, message);
const badRequest = (message = 'Bad request') => new AppError(400, message);
module.exports = { AppError, notFound, forbidden, badRequest };
