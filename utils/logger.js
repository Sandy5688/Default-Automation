const fs = require('fs');
const path = require('path');

const logStream = fs.createWriteStream(path.join(__dirname, '../logs/trapEvents.log'), { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}\n`;
  console.log(logMsg);
  logStream.write(logMsg);
}

module.exports = {
  info: (msg) => log(`INFO: ${msg}`),
  error: (msg) => log(`ERROR: ${msg}`),
};
