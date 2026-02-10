const vibes = [
    "hyper-energetic trader",
    "chill floor manager",
    "mysterious alpha hunter",
    "straight-to-the-point analyst",
    "slightly chaotic moon-boy"
];

function testPromptGeneration(humanNames, contextData) {
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const prompt = `
            [Vibe: ${randomVibe}]
            Task: Greet these new members: ${humanNames}.
            Context: They just joined the crypto community. ${contextData}
            Style: High energy, trader slang, welcoming but professional.
            Requirement: One single concise message. Ensure you mention each member by their provided handle or name to tag them.
            Instruction: Always lead with a friendly greeting and welcome the new members. Be creative with how you integrate the market data, but the greeting must come first.
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

if (samplePrompt.includes("Do NOT use standard greetings")) {
    console.log("❌ Old instructions still present in prompt");
    process.exit(1);
} else {
    console.log("✅ Old instructions removed from prompt");
}
