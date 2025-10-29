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
- **Adaptive Response Style**: Detects when to use:
  - Short responses (phone conversations, quick exchanges)
  - Balanced responses (normal conversation)
  - Detailed responses (action scenes, intense narration)
- **POV Detection**: Automatically switches perspective when another character takes focus

### 👗 Detailed State Tracking
- **Character State**: Mood, affection, energy levels
- **Appearance**: Individual clothing items with state, position, condition, fastened status
- **Environment**: Location, time of day, lighting
- **Scene**: Characters present, activity, intensity
- **Conversation**: Style, exchange count

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
3. Enter repository URL: `https://github.com/Aryangpt007/Context_Helper_Dual`
4. Click **Install**
5. Restart SillyTavern (Ctrl+F5)

### Method 2: Manual Installation

1. Navigate to SillyTavern directory:
   ```
   SillyTavern/public/scripts/extensions/third-party/
   ```

2. Clone or copy the extension:
   ```bash
   git clone https://github.com/Aryangpt007/Context_Helper_Dual
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

### Modes Explained

**Balanced** (Recommended - 50% savings):
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

**Minimal** (70% savings):
- Keeps only 3 recent messages
- No compressed history
- ~900 tokens per message

**Aggressive** (30% savings):
- Keeps 10 recent messages
- Full compressed history
- ~8,000 tokens per message

### Cost Comparison (100 messages with GPT-4)

| Mode | Tokens/msg | Cost/msg | Cost/100 msgs | Savings |
|------|------------|----------|---------------|---------|
| **Off** (full history) | 11,500 | $0.115 | **$11.50** | - |
| **Balanced** ⭐ | 1,600 | $0.016 | **$1.60** | **$9.90 (86%)** |
| **Minimal** | 900 | $0.009 | **$0.90** | **$10.60 (92%)** |
| **Aggressive** | 8,000 | $0.080 | **$8.00** | **$3.50 (30%)** |


### What Gets Lost? (Quality Check)

✅ **Preserved**:
- Character personality (from compressed card)
- Current mood, affection, energy
- Recent conversation (last 6 messages)
- Important events (tracked in state.history)
- Clothing details (fully tracked)
- Location, time, scene intensity

❌ **Compressed**:
- Lengthy character backstory (kept in summary)
- Old messages (summarized, not lost)
- Redundant descriptions

**Quality impact**: Minimal! State tracking preserves what matters.

## Cost Efficiency

### Optimized Token Usage
- **LLM-A prompt**: ~600 tokens (reduced from ~2500 tokens - 76% optimization!)
- **Dictionary-based system**: Mode/pacing descriptions stored in JavaScript, not sent to LLM
- **Smart context replacement**: LLM-B receives compressed context (86% reduction!)

### Estimated Costs per 100 Messages

**LLM-A (State Tracking)**:
- Free Llama via OpenRouter: **$0.00**
- GPT-3.5-turbo: ~$0.165
- Claude Haiku: ~$0.10

**LLM-B (Main Roleplay) with Smart Context**:
| Model | Without Compression | With Balanced Mode | Savings |
|-------|-------------------|-------------------|---------|
| GPT-4 | $11.50 | **$1.60** | **$9.90** |
| Claude 3.5 Sonnet | $34.50 | **$4.80** | **$29.70** |
| GPT-3.5-turbo | $1.15 | **$0.16** | **$0.99** |

**Total Cost (LLM-A + LLM-B) per 100 messages:**
- **Best Budget**: Free Llama (LLM-A) + GPT-3.5 (LLM-B) = **$0.16** 🎉
- **Best Quality**: GPT-3.5 (LLM-A) + Claude 3.5 (LLM-B) = **$4.97**
- **Premium Setup**: GPT-4 (both) = **$1.77**

**Old way without extension**: GPT-4 alone = **$11.50** per 100 messages

## Usage Examples

### Example 1: Intimate Scene with Clothing Tracking

**User**: "I slowly unbutton her blouse"

**LLM-A tracks**:
```json
{
  "appearance.clothes_details.blouse": {
    "state": "worn",
    "fastened": false,
    "condition": "pristine"
  },
  "appearance.clothes_details.bra": {
    "visibility": "visible"
  },
  "appearance.body_exposure": "partial",
  "scene.intensity": "intimate"
}
```

**LLM-B receives**:
```
CLOTHING STATE:
Wearing: blouse [unfastened], skirt, bra [now visible]
⚠️ Underwear visible: bra
Body exposure: partial
Scene intensity: intimate
```

**Result**: Character response reflects the specific clothing state accurately!

### Example 2: Phone Call Mode

**User**: "I call Sarah on her cell"

**LLM-A sets**: `mode: phone_call, pacing: normal, length: brief`

**LLM-B receives**:
```
CRITICAL: User can ONLY hear audio. NO visual descriptions.
Keep response BRIEF: 1-2 sentences max.
```

**Character response**: 
> "Hey! *cheerful voice* Oh, I was just thinking about you. What's up?"

(Notice: NO visual descriptions, NO actions, just voice and tone!)

### Example 3: Text Message

**User**: I text her "want to grab coffee?"

**LLM-A sets**: `mode: text_message, pacing: rapid_fire, length: brief`

**Character response**:
> "yeah sounds good! when?"

(Notice: NO narration, NO actions, just the text message content!)

## Troubleshooting

### Extension doesn't appear in menu
- Check files are in `SillyTavern/public/scripts/extensions/third-party/st-rpg-chatbot/`
- Refresh SillyTavern (Ctrl+F5)
- Check browser console (F12) for errors

### LLM-A calls fail
- Verify API key is correct (no extra spaces)
- Check API provider spelling matches exactly
- Ensure you have API credits/quota
- Check browser console for detailed error messages

### State not persisting between chats
- State is saved per-chat in chat metadata
- Each chat has its own independent state
- Use "Reset State" button to clear current chat's state

### Bot still writes long paragraphs during phone calls
1. Enable Debug Mode in extension settings
2. Send a test message
3. Check console for `[RPG Chatbot] LLM-A Analysis`
4. Verify `conversation.mode` is set to `phone_call`
5. Check that context injection shows mode restrictions

### Templates not loading (404 errors)
- Extension name MUST be `third-party/st-rpg-chatbot` in `index.js`
- Check that files are in the correct folder structure
- Restart SillyTavern completely

### "state.pov is undefined" error
- This was fixed in recent version
- Hard refresh SillyTavern (Ctrl+F5)
- Extension now auto-merges old states with new structure

## Advanced Features

### Custom State Variables

The extension tracks:
- **Character**: mood, mood_intensity, affection, energy, emotional_state
- **Appearance**: clothes, clothes_details, body_exposure
- **Environment**: location, time_of_day, lighting, privacy_level
- **Scene**: characters_present, activity, POV character, intensity
- **Conversation**: mode, pacing, exchange_style, response_length
- **POV**: current_character, sensory awareness, awareness_level

Edit `index.js` to add custom tracking:
```javascript
stateManager = {
    state: {
        character: { mood: "neutral", custom_metric: 0 },
        // ... add your own fields
    }
}
```

### Architecture Details

#### Dictionary-Based Optimization

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

---

### Custom State Variables

The extension tracks these state categories:
- `character`: mood, affection, energy
- `appearance`: clothes, clothes_details, body_exposure
- `environment`: location, time_of_day, lighting
- `scene`: characters_present, activity, intensity
- `conversation`: style, tone

### Memory Compression

After 20 messages (configurable), old messages are automatically compressed:
- Last 6 messages kept in full detail
- Older messages summarized by LLM-A
- Important moments flagged separately
- Reduces token costs significantly

### Conversation Style Detection

LLM-A automatically detects:
- Quick back-and-forth dialogue → short responses
- Phone/text conversations → brief format
- Detailed narration → multi-paragraph responses
- Action scenes → dynamic, fast-paced

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

## Support

- **GitHub Issues**: https://github.com/Aryangpt007/Project_Smartex/issues
- **Documentation**: See main repo README
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

---

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
- ✅ Added 6 auto-detected conversation modes:
  - `in_person`: Full roleplay (default)
  - `phone_call`: Audio only, NO visual descriptions
  - `text_message`: Text only, NO actions
  - `video_call`: Camera view only
  - `letter`: Written correspondence
  - `thoughts`: Internal monologue
- ✅ Added 4 pacing types: rapid_fire, normal, slow_burn, contemplative
- ✅ POV switching: Auto-detects when character leaves scene
- ✅ Comprehensive clothing tracking:
  - Individual item tracking (state/position/fastened/condition/visibility)
  - Body exposure levels (none/partial/significant/intimate)
  - Perfect for NSFW scenes
- ✅ Fixed: State panel persistence (#sheld container)
- ✅ Fixed: "state.pov undefined" error with state merging
- ✅ Fixed: First message initialization issue

### v1.0.0 (2025-10-27)
**Initial Release**
- ✅ Two-LLM architecture (LLM-A tracks state, LLM-B generates roleplay)
- ✅ Basic state tracking (mood, affection, location, clothes)
- ✅ Memory compression for long chats
- ✅ State panel UI
- ✅ Debug mode
- ✅ Support for OpenAI, Anthropic, OpenRouter

---

## Roadmap (Future Enhancements)

Inspired by GuidedGenerations Extension:
- [ ] **Prompt Overrides**: Customize LLM-A prompt templates per user
- [ ] **Visual State Timeline**: See state changes over time
- [ ] **Custom Condition Triggers**: Auto-trigger actions when state reaches threshold
- [ ] **Multi-Character Tracking**: Track multiple characters simultaneously
- [ ] **Export/Import States**: Save and load state snapshots

---

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

---
