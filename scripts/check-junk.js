const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

// Keep committed assets small enough to review and clone comfortably.
const maxBytes = 1024 * 1024;
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const junkPatterns = [
  /(^|\/)node_modules\//i,
  /(^|\/)(?:dist|build|coverage|logs?|tmp|temp|uploads|deploy)\//i,
  /(^|\/)\.env(?:\..*)?$/i,
  /(^|\/)[^/]+\.(?:md|markdown|mdx)$/i,
  /\.(?:zip|rar|7z|tar|gz|tgz|bak|swp)$/i,
  /(^|\/)(?:\.DS_Store|Thumbs\.db|\.idea|\.vscode)(?:\/|$)/i,
  /(?:^|\/)(?:npm-debug\.log|error_log|stderr\.log)$/i,
];

const violations = [];
for (const file of trackedFiles) {
  const normalized = file.replaceAll('\\', '/');
  if (normalized !== '.env.example' && junkPatterns.some((pattern) => pattern.test(normalized))) {
    violations.push(`tracked junk: ${file}`);
  }

  try {
    if (fs.statSync(file).size > maxBytes) {
      violations.push(`tracked file exceeds 1 MB: ${file}`);
    }
  } catch (error) {
    violations.push(`cannot inspect tracked file: ${file} (${error.code || 'unknown error'})`);
  }
}

if (violations.length) {
  console.error('Repository junk check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`Repository junk check passed (${trackedFiles.length} tracked files checked).`);
}
