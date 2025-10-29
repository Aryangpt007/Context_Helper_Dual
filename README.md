# RPG Character Chatbot - SillyTavern Extension

An advanced two-LLM architecture for immersive roleplay with persistent state tracking and intelligent context management.

## Features

### 🎯 Two-LLM Architecture
- **LLM-A (State Tracker)**: Fast, cheap model (GPT-3.5, Claude Haiku, or free Llama via OpenRouter) that:
  - Tracks character mood, affection, energy
  - Monitors detailed clothing states (for NSFW scenes)
  - Tracks environment, location, time
  - Detects scene intensity and POV shifts
  - Adapts response style (short/balanced/detailed)
  
- **LLM-B (Roleplay Engine)**: Your SillyTavern connection profile model receives:
  - Filtered, relevant context from LLM-A
  - Smart response style instructions
  - POV character information
  - Current mood and scene details

### 🔍 Smart Context Management
- **Memory Compression**: Automatically summarizes old messages to maintain long-term context
- **Adaptive Response Style**: Detects when to use short, balanced, or detailed responses
- **POV Detection**: Automatically switches perspective when another character takes focus

### 👗 Detailed State Tracking
- **Character State**: Mood, affection, energy levels
- **Appearance**: Individual clothing items with state, position, condition, fastened status
- **Environment**: Location, time of day, lighting
- **Scene**: Characters present, activity, intensity
- **Conversation**: Style, tone

### 🎭 Conversation Modes (Auto-Detected)
- **in_person**: Full roleplay with all sensory details
- **phone_call**: Audio only - NO visual descriptions
- **text_message**: Text only - NO actions or narration
- **video_call**: Camera view only - upper body visible
- **letter**: Written correspondence format
- **thoughts**: Character's internal monologue

### ⚡ Conversation Pacing
- **rapid_fire**: 1-2 sentences (urgent situations, phone calls)
- **normal**: 2-4 sentences (regular conversation)
- **slow_burn**: 4-8 sentences (emotional moments)
- **contemplative**: 6-10 sentences (reflection, detailed scenes)

### 👔 Comprehensive Clothing Tracking
Each item tracked with:
- **State**: worn, removed, loosened, shifted, torn
- **Position**: normal, pulled_up, pulled_down, askew
- **Fastened**: buttons/zippers state
- **Condition**: pristine, wrinkled, disheveled, torn, stained
- **Visibility**: hidden, visible, partially_visible
- **Body Exposure**: none, partial, significant, intimate

Perfect for NSFW/intimate scenes where clothing details matter!

## Installation

### Method 1: Extension Manager (Recommended)

1. Open SillyTavern
2. Go to **Extensions** → **Install Extension**
3. Enter repository URL: `https://github.com/Aryangpt007/st-rpg-chatbot`
4. Click **Install**
5. Restart SillyTavern (Ctrl+F5)

### Method 2: Manual Installation

1. Navigate to `SillyTavern/public/scripts/extensions/third-party/`
2. Clone or copy the extension:
   ```bash
   git clone https://github.com/Aryangpt007/st-rpg-chatbot
   ```
3. Restart SillyTavern
4. Enable in **Extensions** → **RPG Character Chatbot**

## Configuration

### Step 1: Enable Extension
1. Open **Extensions** → **RPG Character Chatbot**
2. Check **Enable RPG Character Chatbot**

### Step 2: Configure LLM-A (State Tracker)
Choose a fast, cheap model for state tracking:

**Option 1: OpenAI GPT-3.5**
- Provider: OpenAI
- API Key: Your OpenAI API key
- Model: `gpt-3.5-turbo`

**Option 2: Anthropic Claude Haiku**
- Provider: Anthropic
- API Key: Your Anthropic API key
- Model: `claude-3-haiku-20240307`

**Option 3: Free Llama via OpenRouter** (Recommended for budget users)
- Provider: OpenRouter
- API Key: Your OpenRouter API key (free tier available)
- Model: `meta-llama/llama-3.2-3b-instruct:free`

### Step 3: Configure LLM-B (Main Roleplay)
**No configuration needed!** The extension uses your existing SillyTavern connection profile.

Just configure your preferred model in SillyTavern's **API Connections** as usual:
- OpenAI GPT-4
- Anthropic Claude 3.5 Sonnet
- Local models (KoboldAI, Oobabooga, etc.)
- Any other API you use

### Step 4: Advanced Options (Optional)
- **Debug Mode**: Shows LLM-A analysis in console (useful for troubleshooting)
- **Memory Compression**: Enable to compress old messages (recommended for long chats)
- **Show State Panel**: Display current character state above chat

## How It Works

### Message Flow
```
User Input
    ↓
LLM-A analyzes (cheap model):
  - Updates mood, affection, energy
  - Tracks clothing changes
  - Detects conversation mode
  - Determines response pacing
    ↓
Context Injection:
  - Filtered state summary
  - Mode-specific instructions
  - Pacing guidelines
    ↓
LLM-B generates (your model):
  - Receives enhanced context
  - Follows mode restrictions
  - Adapts response length
    ↓
Response to User
```

### Example: Phone Call Detection

**User sends**: "I call her on the phone"

**LLM-A detects**:
```json
{
  "conversation.mode": "phone_call",
  "conversation.pacing": "normal",
  "conversation.response_length": "brief"
}
```

**Context sent to LLM-B**:
```
[RESPONSE INSTRUCTIONS]
CRITICAL: User can ONLY hear audio. NO visual descriptions, 
body language, or physical actions. Only dialogue, voice tone, and sounds.

Mode: phone_call | Pacing: normal | Length: brief (1-2 sentences)
```

**Result**: Character responds with ONLY audio content (voice, tone, background sounds)

## Problems Solved

### ❌ Before Extension
- AI forgets mood changes after a few messages
- Clothing states lost in long conversations
- Always responds with long paragraphs (even during phone calls!)
- No POV switching when other characters appear
- State details buried in context window
- Character describes visuals during phone calls
- Actions appear in text messages

### ✅ With Extension
- ✅ Persistent mood tracking
- ✅ Detailed clothing states (perfect for NSFW)
- ✅ Adaptive response length based on mode + context
- ✅ Automatic POV detection and switching
- ✅ Compressed memory for long-term coherence
- ✅ Only relevant context sent to main model
- ✅ Mode enforcement (phone = audio only, text = text only)
- ✅ Pacing control (urgent = brief, emotional = detailed)
- ✅ **Smart Context Management: Actually reduces LLM-B token costs!**

## State Panel

The state panel shows current tracking:
```
⚡ Character State
━━━━━━━━━━━━━━━━
Mood: happy (8/10)     Affection: 7
Location: cafe         Intensity: calm
Mode: in_person        Pacing: normal
POV: Character Name

Clothes:
• dress: worn (normal, fastened)
• heels: worn (normal)
• bra: worn (hidden)
```

## 💰 Smart Context Management (THE MONEY SAVER!)

### The Real Problem

- Character card: 1000-2000 tokens
- Long chat (100+ messages): 10,000+ tokens
- **Total per message: 11,000-12,000 tokens** → Premium models become unaffordable!

### Our Solution: Smart Context Replacement

The extension **replaces SillyTavern's full context** with:

1. **Compressed Character Card** (1500 tokens → 300 tokens)
   - Keeps: Name, personality traits, key background
   - Removes: Lengthy backstories, redundant descriptions

2. **State Tracking as Context** (replaces 10,000 tokens of history)
   - Current mood, affection, location
   - Recent events (last 3 important moments)
   - Clothing state
   - **This IS your long-term memory!**

3. **Recent Messages Only** (configurable: 3-10 messages)
   - Keeps conversation flow
   - Removes redundant old messages

4. **Compressed Old History** (optional)
   - Summaries of earlier conversations
   - Preserves major plot points

### Token Savings Example

**Balanced Mode** (Recommended - 86% savings):
```
Character Card: 300 tokens (compressed)
State Context: 200 tokens (mood, affection, clothes, location)
Compressed History: 500 tokens (summaries of old messages)
Recent 6 messages: 600 tokens
───────────────────────
TOTAL: ~1,600 tokens per message

vs Normal: ~11,500 tokens
SAVINGS: 86% reduction!
```

**Minimal** (92% savings):
- Keeps only 3 recent messages
- No compressed history
- ~900 tokens per message

**Aggressive** (74% savings):
- Keeps 10 recent messages
- Full compressed history
- ~3,000 tokens per message

## Architecture Details

### Dictionary-Based Optimization

The extension uses a **dictionary-based system** to reduce prompt size:

**Before optimization**: ~2500 tokens sent to LLM-A  
**After optimization**: ~600 tokens sent to LLM-A (76% reduction!)

**How it works**:
1. Mode/pacing descriptions stored in JavaScript dictionaries
2. LLM-A receives concise mode lists, returns mode name
3. JavaScript fetches full instructions from dictionary
4. Full instructions sent to LLM-B

**Example**:
```javascript
// Stored in JavaScript (not sent to LLM-A)
CONVERSATION_MODES["phone_call"] = {
  allows: ["dialogue", "voice_tone", "background_sounds"],
  restricts: ["visual_descriptions", "body_language"],
  instruction: "CRITICAL: User can ONLY hear audio...",
  length_default: "brief"
};

// LLM-A just returns: "phone_call"
// JavaScript looks up and sends full instruction to LLM-B
```

**Benefits**:
- 76% fewer tokens to LLM-A = lower costs
- Faster LLM-A processing
- Less context confusion
- Easier to maintain (change modes in one place)
- Can add new modes without bloating prompt

### Memory Compression

After 20 messages (configurable):
- Last 6 messages kept in full detail
- Older messages summarized by LLM-A
- Important moments preserved
- Reduces token costs significantly

### Debug Mode

Enable to see:
- Complete LLM-A analysis (JSON output)
- State updates being applied
- Context summary sent to LLM-B
- Detected conversation mode and pacing
- Prompt optimization details

## Compatibility

- **SillyTavern Version**: 1.10.0 or newer
- **Browsers**: Chrome, Firefox, Edge (latest versions)
- **APIs**: OpenAI, Anthropic, OpenRouter, KoboldAI, Oobabooga, etc.

## API Provider Setup

### OpenRouter (Free Option)
1. Sign up at https://openrouter.ai
2. Go to **Keys** section
3. Create API key
4. Use model: `meta-llama/llama-3.2-3b-instruct:free`
5. No credit card required for free tier!

### OpenAI
1. Sign up at https://platform.openai.com
2. Add billing information
3. Go to **API Keys**
4. Create new secret key
5. Use models: `gpt-3.5-turbo`, `gpt-4`

### Anthropic
1. Sign up at https://console.anthropic.com
2. Add billing
3. Go to **API Keys**
4. Create key
5. Use models: `claude-3-haiku-20240307`, `claude-3-5-sonnet-20241022`

## Development

### File Structure
```
st-rpg-chatbot/
├── manifest.json        # Extension metadata
├── index.js             # Main logic
├── settings.html        # Settings UI
├── state_panel.html     # State display
├── style.css            # Styling
└── README.md            # Documentation
```

### Extending Functionality

The extension exposes hooks for:
- Custom state variables
- Additional LLM providers
- Custom UI panels
- Event listeners

## FAQ

### Q: Does this replace my SillyTavern model?
**A:** No! It works WITH your existing setup. LLM-A just adds intelligence, your configured model (LLM-B) still generates responses.

### Q: How much does it cost?
**A:** Free with OpenRouter's Llama 3.2 3B! Or $0.10-0.20 per 100 messages with paid models.

### Q: Will it work with local models?
**A:** Yes! LLM-B can be ANY SillyTavern connection (KoboldAI, Oobabooga, etc.). LLM-A needs an API that supports JSON output.

### Q: Does it track multiple characters?
**A:** Currently tracks one primary character. Multi-character support planned for future release.

### Q: Can I customize what gets tracked?
**A:** No.

### Q: Why use two models instead of one?
**A:** Separation of concerns:
- State tracking needs consistency (low temp, cheap model)
- Roleplay needs creativity (high temp, good model)
- Filters irrelevant context (saves tokens)
- Can use free model for tracking, premium for roleplay

## Changelog

### v1.2.0 (2025-10-29)
**Prompt Optimization & Dictionary System**
- ✅ Reduced LLM-A prompt from ~2500 to ~600 tokens (76% reduction)
- ✅ Implemented dictionary-based mode/pacing system
- ✅ 63% lower LLM-A costs per message
- ✅ Faster LLM-A processing with smaller prompts
- ✅ Easier maintenance (change modes in one place)

### v1.1.0 (2025-10-28)
**Conversation Modes & Enhanced State Tracking**
- ✅ Added 6 auto-detected conversation modes
- ✅ Added 4 pacing types: rapid_fire, normal, slow_burn, contemplative
- ✅ POV switching: Auto-detects when character leaves scene
- ✅ Comprehensive clothing tracking with body exposure levels
- ✅ Fixed: State panel persistence and initialization issues

### v1.0.0 (2025-10-27)
**Initial Release**
- ✅ Two-LLM architecture (LLM-A tracks state, LLM-B generates roleplay)
- ✅ Basic state tracking (mood, affection, location, clothes)
- ✅ Memory compression for long chats
- ✅ State panel UI
- ✅ Debug mode
- ✅ Support for OpenAI, Anthropic, OpenRouter

## Roadmap (Future Enhancements)

Inspired by GuidedGenerations Extension:
- [ ] **Prompt Overrides**: Customize LLM-A prompt templates per user
- [ ] **Visual State Timeline**: See state changes over time
- [ ] **Custom Condition Triggers**: Auto-trigger actions when state reaches threshold
- [ ] **Multi-Character Tracking**: Track multiple characters simultaneously
- [ ] **Export/Import States**: Save and load state snapshots

## Support

- **GitHub Issues**: https://github.com/Aryangpt007/Project_Smartex/issues
- **Documentation**: See this README
- **Discord**: Post in SillyTavern extensions channel

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Include tests and documentation

## License

MIT License - See LICENSE file for details

## Credits

- Built with the two-LLM architecture from Project_Smartex
- Inspired by character bots from Character.AI, Chub.ai, Janitor.AI
- Thanks to SillyTavern team for the excellent framework
- Learned from GuidedGenerations Extension by Samueras
