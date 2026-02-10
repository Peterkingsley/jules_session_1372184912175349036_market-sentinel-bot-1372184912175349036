const vibes = [
    "patient educator",
    "objective analyst",
    "helpful community guide",
    "clear translator",
    "knowledgeable mentor"
];

function testPromptGeneration(humanNames, contextData) {
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const prompt = `
            [Vibe: ${randomVibe}]
            Task: Greet these new members: ${humanNames}.
            Context: They just joined the crypto community. ${contextData}
            Style: Friendly, clear, and educational. Explain the market data simply if it's there.
            Requirement: One single concise message. Ensure you mention each member by their provided handle or name to tag them.
            Instruction: Always lead with a friendly greeting and welcome the new members. Your goal is to make them feel informed and welcome without using hype or jargon.
        `;
    return prompt;
}

console.log("--- Testing Prompt Generation ---");
const samplePrompt = testPromptGeneration("@jules, @alice", "Market Update: Bitcoin (BTC) is currently at 0000 with a 24h change of 2%.");
console.log(samplePrompt);

if (vibes.some(v => samplePrompt.includes(v))) {
    console.log("✅ Vibe included in prompt");
} else {
    console.log("❌ Vibe NOT included in prompt");
    process.exit(1);
}

if (samplePrompt.includes("Always lead with a friendly greeting")) {
    console.log("✅ New instructions included in prompt");
} else {
    console.log("❌ New instructions NOT included in prompt");
    process.exit(1);
}

if (samplePrompt.includes("Your goal is to make them feel informed and welcome without using hype or jargon")) {
    console.log("✅ Educator goal included in prompt");
} else {
    console.log("❌ Educator goal NOT included in prompt");
    process.exit(1);
}
