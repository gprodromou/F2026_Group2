// server.js: starts the backend server.
// We never run this file by typing its name. Instead, package.json has shortcuts called "scripts":
//   npm start   --> runs "node src/server.js"           (start normally)
//   npm run dev --> runs "node --watch src/server.js"   (restarts on every save)
// So both commands end up running this file.

// Load the app (with its routes) and the settings (with the port).
const app = require('./app');
const config = require('./config');

// Start listening for requests on the port from the settings.
// The program keeps running and waiting for requests until you stop it manually with Ctrl+C.
// The function inside runs once, when the server is ready.
app.listen(config.port, () => {
    // Print a message in the terminal so we know the server is ready and where to open it.
    // The backticks (`) make a "template string": anything inside ${ } is replaced by its value, ${config.port} becomes 3000. 
    // And the server is running on http://localhost:3000
    console.log(`Server running on http://localhost:${config.port}`);
});