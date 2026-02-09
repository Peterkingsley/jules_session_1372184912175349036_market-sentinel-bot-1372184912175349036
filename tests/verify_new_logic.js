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
        Instruction: Do NOT use standard greetings. Be creative with how you present this data. Vary the structure: sometimes lead with the market data, sometimes with a question, sometimes with the welcome.
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
}

if (samplePrompt.includes("Do NOT use standard greetings")) {
    console.log("✅ Instructions included in prompt");
} else {
    console.log("❌ Instructions NOT included in prompt");
}
