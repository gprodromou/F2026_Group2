// This file is the app's error handling.
// Without this file, Express answers errors with an HTML page, which the React frontend can't read.
// With it, every error comes back as short JSON format like { "error": "Not found" }, so the frontend can show a message.

// this function runs when the URL matches none of our routes (for example /hello-world).
// It answers with an error 404, which means "not found".
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// this function runs when something breaks inside any route (for example the database fails).
// Express knows this is the error handler because it has 4 parameters, and the error (err) comes first.
function errorHandler(err, req, res, next) {
  // Print the full error in our terminal, so we can see what went wrong and fix it.
  console.error(err);

  // Send the user only a short message with error 500 ("server error").
  res.status(500).json({ error: 'Something went wrong' });
}

// Share both functions, so our app can use them.
module.exports = { notFound, errorHandler };