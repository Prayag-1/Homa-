const connectDB = require('../config/db');
const { migrateEnvSmtpSettings } = require('../services/smtpService');

async function main() {
  await connectDB();
  const result = await migrateEnvSmtpSettings();
  process.stdout.write(
    `SMTP migration complete: ${result.reason}${result.created ? ' (created active record)' : ''}\n`,
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`SMTP migration failed: ${error.message}\n`);
  process.exit(1);
});
