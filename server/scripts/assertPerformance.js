const fs = require("fs");

const [, , reportPath] = process.argv;

if (!reportPath) {
  console.error(
    "Usage: node scripts/assertPerformance.js <artillery-report.json>",
  );
  process.exit(1);
}

if (!fs.existsSync(reportPath)) {
  console.error(`Performance report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const p95 = report?.aggregate?.summaries?.["http.response_time"]?.p95;
const p99 = report?.aggregate?.summaries?.["http.response_time"]?.p99;
const counters = report?.aggregate?.counters || {};
const success2xx = Object.keys(counters)
  .filter((k) => /^http\.codes\.(2\d\d)$/.test(k))
  .reduce((acc, key) => acc + counters[key], 0);
const serverErrors = Object.keys(counters)
  .filter((k) => /^http\.codes\.(5\d\d)$/.test(k))
  .reduce((acc, key) => acc + counters[key], 0);

const MAX_P95_MS = 1500;
const MAX_P99_MS = 2500;

const errors = [];

if (typeof p95 !== "number") {
  errors.push("Missing p95 latency in Artillery report");
} else if (p95 > MAX_P95_MS) {
  errors.push(`p95 too high: ${p95}ms (max ${MAX_P95_MS}ms)`);
}

if (typeof p99 !== "number") {
  errors.push("Missing p99 latency in Artillery report");
} else if (p99 > MAX_P99_MS) {
  errors.push(`p99 too high: ${p99}ms (max ${MAX_P99_MS}ms)`);
}

if (success2xx <= 0) {
  errors.push("No successful 2xx responses recorded");
}

if (serverErrors > 0) {
  errors.push(`Server errors detected: ${serverErrors}`);
}

if (errors.length > 0) {
  console.error("Performance gate failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(
  `Performance gate passed: p95=${p95}ms, p99=${p99}ms, 2xx=${success2xx}, 5xx=${serverErrors}`,
);
