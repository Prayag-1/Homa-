const logger = {
  stream: {
    write: (message) => process.stdout.write(message),
  },
  warn: (message) => process.stderr.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

module.exports = logger;
