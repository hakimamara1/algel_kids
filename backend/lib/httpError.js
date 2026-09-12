// An error whose message is safe to show to the client, with its HTTP status
class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.details = details;
    }
}

module.exports = { HttpError };
