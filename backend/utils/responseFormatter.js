//C:\quran-similarity-app\backend\utils\responseFormatter.js
const formatSuccess = (data = null, message = "Success") => ({
    success: true,
    message,
    data,
});

const formatError = (message = "An error occurred", statusCode = 400) => ({
    success: false,
    message,
    statusCode,
});

module.exports = { formatSuccess, formatError };