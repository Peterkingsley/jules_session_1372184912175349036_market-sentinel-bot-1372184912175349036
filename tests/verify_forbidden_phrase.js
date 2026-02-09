const { SYSTEM_PROMPT } = require('../src/ai');

console.log('--- Verifying Forbidden Phrase in SYSTEM_PROMPT ---');

const forbiddenPhrase = "Grab your seat and keep your eyes on the tip because the alpha starts now";

if (SYSTEM_PROMPT.includes(forbiddenPhrase)) {
    console.log('✅ Found forbidden phrase mention in SYSTEM_PROMPT (as a restriction)');
} else {
    console.log('❌ Forbidden phrase NOT found in SYSTEM_PROMPT');
    process.exit(1);
}

if (SYSTEM_PROMPT.includes('NEVER use the phrase')) {
    console.log('✅ Negative constraint is explicitly stated');
} else {
    console.log('❌ Negative constraint wording NOT found');
    process.exit(1);
}

console.log('--- Verification Successful ---');
