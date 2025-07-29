/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        status: err.status || 500,
        message: err.message || 'Internal Server Error'
    };

    // Validation errors
    if (err.name === 'ValidationError') {
        error.status = 400;
        error.message = 'Validation Error';
        error.details = err.details;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.status = 401;
        error.message = 'Invalid token';
    }

    // Axios errors (external API calls)
    if (err.response) {
        error.status = err.response.status;
        error.message = err.response.data?.message || 'External API error';
    }

    // Development vs production error details
    const response = {
        error: error.message,
        status: error.status
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = error.details;
    }

    res.status(error.status).json(response);
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    asyncHandler
};
