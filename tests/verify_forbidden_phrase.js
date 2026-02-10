const { SYSTEM_PROMPT } = require('../src/ai');

console.log('--- Verifying Educator Persona in SYSTEM_PROMPT ---');

const expectedPersona = "Crypto News Educator";

if (SYSTEM_PROMPT.includes(expectedPersona)) {
    console.log('✅ Found expected persona: ' + expectedPersona);
} else {
    console.log('❌ Expected persona NOT found in SYSTEM_PROMPT');
    process.exit(1);
}

if (SYSTEM_PROMPT.includes('Explain "What happened" and "Why it matters"')) {
    console.log('✅ Simplification instructions found');
} else {
    console.log('❌ Simplification instructions NOT found');
    process.exit(1);
}

if (SYSTEM_PROMPT.includes('Do not use "hype" language or "alpha" talk')) {
    console.log('✅ Negative constraint against hype is explicitly stated');
} else {
    console.log('❌ Negative constraint wording NOT found');
    process.exit(1);
}

console.log('--- Verification Successful ---');
