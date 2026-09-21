// Reuses the complete real-input route up to the recorded DAY9 financial actions.
process.env.TEST_SCENARIO='day9-finance';
process.env.TEST_URL ||= 'http://127.0.0.1:5174';
await import('./verify-session.mjs');
