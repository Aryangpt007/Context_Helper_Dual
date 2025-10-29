/**
 * RPG Character Chatbot - SillyTavern Extension
 * Two-LLM architecture with persistent state tracking and memory compression
 */

import { extension_settings, getContext, renderExtensionTemplateAsync, saveMetadataDebounced } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types, extension_prompt_types, chat_metadata, generateQuietPrompt } from "../../../../script.js";

const extensionName = "third-party/st-rpg-chatbot";
const extensionFolderPath = `scripts/extensions/third-party/st-rpg-chatbot`;
const MODULE_NAME = "RPG-Chatbot";

// Conversation Mode Definitions (used for context building, not sent to LLM-A)
const CONVERSATION_MODES = {
    "in_person": {
        allows: ["dialogue", "actions", "expressions", "environment", "touch"],
        restricts: [],
        instruction: "Full roleplay with actions and narration",
        length_default: "balanced"
    },
    "phone_call": {
        allows: ["dialogue", "voice_tone", "background_sounds"],
        restricts: ["visual_descriptions", "body_language", "physical_actions"],
        instruction: "CRITICAL: User can ONLY hear audio. NO visual descriptions, body language, or physical actions. Only dialogue, voice tone, and sounds.",
        length_default: "brief"
    },
    "text_message": {
        allows: ["text_content", "emojis"],
        restricts: ["all_physical_descriptions", "actions", "narration"],
        instruction: "CRITICAL: Respond ONLY with the text message content. NO actions, narration, or descriptions. Just the message text.",
        length_default: "brief"
    },
    "video_call": {
        allows: ["dialogue", "facial_expressions", "upper_body", "background"],
        restricts: ["full_body", "physical_touch", "smell"],
        instruction: "CRITICAL: User can only see upper body/face on camera. NO full body descriptions or physical touch. Limited to what's visible on screen.",
        length_default: "balanced"
    },
    "letter": {
        allows: ["written_content", "formal_tone"],
        restricts: ["realtime_interaction"],
        instruction: "Written correspondence - formal letter format with greeting and closing.",
        length_default: "detailed"
    },
    "thoughts": {
        allows: ["internal_monologue", "character_perspective"],
        restricts: ["direct_interaction"],
        instruction: "Character's internal thoughts - first-person perspective, no direct interaction with user.",
        length_default: "detailed"
    }
};

// Pacing Definitions
const PACING_TYPES = {
    "rapid_fire": {
        sentences: "1-2",
        instruction: "Keep response BRIEF: 1-2 sentences max. Quick exchange.",
        use_when: ["phone_calls", "arguments", "urgent_situations", "quick_questions"]
    },
    "normal": {
        sentences: "2-4",
        instruction: "Standard conversation flow with dialogue and some action/description.",
        use_when: ["regular_dialogue", "casual_chat"]
    },
    "slow_burn": {
        sentences: "4-8",
        instruction: "Detailed response allowed: Full narration with internal thoughts and atmosphere.",
        use_when: ["emotional_moments", "important_decisions", "intimate_scenes"]
    },
    "contemplative": {
        sentences: "6-10",
        instruction: "Detailed, atmospheric narration with deep introspection.",
        use_when: ["character_alone", "processing_events", "time_passage"]
    }
};

// Default settings
const defaultSettings = {
    enabled: false,
    llm_a_provider: "openai",
    llm_a_api_key: "",
    llm_a_model: "gpt-3.5-turbo",
    llm_a_temperature: 0.3,
    llm_a_max_tokens: 1000,
    use_sillytavern_as_llm_b: true, // New option
    debug_mode: false,
    memory_compression: true,
    compression_threshold: 20,
    show_state_panel: true,
    track_clothes_detail: true,
    // NEW: Smart context management for LLM-B
    smart_context_mode: "auto", // "auto", "aggressive", "balanced", "minimal", "off"
    keep_recent_messages: 6, // Number of recent messages to keep in full
    compress_character_card: true, // Summarize char card to key traits
    max_char_card_tokens: 300, // Target tokens for compressed char card
    compress_old_messages: true, // Replace old messages with summaries
    inject_state_as_context: true // Use our state tracking instead of full history
};

// State management
let stateManager = {
    state: {
        character: { 
            mood: "neutral", 
            mood_intensity: 5, 
            affection: 5, 
            energy: 10,
            emotional_state: "calm",
            focus_on: "user"
        },
        appearance: { 
            clothes: [], 
            clothes_state: "pristine", 
            clothes_details: {}, 
            body_exposure: "none",
            visible_features: []
        },
        environment: { 
            location: "unknown", 
            time_of_day: "afternoon", 
            lighting: "normal",
            privacy_level: "public",
            nearby_people: []
        },
        scene: { 
            characters_present: [], 
            current_activity: "conversation", 
            pov_character: "", 
            scene_intensity: "calm",
            scene_type: "casual"
        },
        conversation: { 
            mode: "in_person", // in_person, phone_call, text_message, video_call, letter, thoughts
            pacing: "normal", // rapid_fire, normal, slow_burn, contemplative
            exchange_style: "dialogue_with_action", // pure_dialogue, dialogue_with_action, narrative_heavy
            response_length: "balanced", // brief, balanced, detailed
            turn_count: 0,
            topic: "general"
        },
        pov: {
            current_character: "", // who's perspective we're in
            can_see: true,
            can_hear: true,
            can_touch: false,
            can_smell: false,
            awareness_level: "full" // full, limited, distant, none
        },
        history: { 
            recent_actions: [], 
            important_events: [],
            relationship_changes: []
        }
    },
    messageHistory: [],
    compressedMemories: [],
    initialized: false
};

// LLM API clients
const llmClients = {
    /**
     * Call LLM-A for state analysis
     */
    async callLLMA(messages) {
        const settings = extension_settings[extensionName];
        return await makeLLMCall(
            messages,
            settings.llm_a_provider,
            settings.llm_a_api_key,
            settings.llm_a_model,
            settings.llm_a_temperature,
            settings.llm_a_max_tokens
        );
    }
};

/**
 * Make an LLM API call
 */
async function makeLLMCall(messages, provider, apiKey, model, temperature, maxTokens) {
    let endpoint, headers, body;

    if (provider === "openai") {
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        };
        body = {
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens
        };
    } else if (provider === "anthropic") {
        endpoint = "https://api.anthropic.com/v1/messages";
        headers = {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        };
        // Convert to Anthropic format
        const systemMsg = messages.find(m => m.role === "system");
        const otherMsgs = messages.filter(m => m.role !== "system");
        body = {
            model: model,
            messages: otherMsgs,
            system: systemMsg ? systemMsg.content : undefined,
            temperature: temperature,
            max_tokens: maxTokens
        };
    } else if (provider === "openrouter") {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://sillytavern.app",
            "X-Title": "SillyTavern RPG Chatbot Extension"
        };
        body = {
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens
        };
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract response based on provider
        if (provider === "anthropic") {
            return data.content[0].text;
        } else {
            return data.choices[0].message.content;
        }
    } catch (error) {
        console.error("LLM API call failed:", error);
        throw error;
    }
}

/**
 * Build LLM-A system prompt
 */
/**
 * Build system prompt for LLM-A with comprehensive state tracking rules
 */
function buildLLMASystemPrompt(characterInfo) {
    return `You are a state-tracking AI for RPG chatbot. Analyze user input and return JSON with state updates.

CHARACTER: ${characterInfo.name}

CONVERSATION MODES (detect from context):
- in_person: face-to-face (default)
- phone_call: audio only (when calling/phone mentioned)
- text_message: texting (when texting/messaging mentioned)
- video_call: video chat (when video/FaceTime mentioned)
- letter: written correspondence
- thoughts: internal monologue (when character absent)

PACING (detect from context):
- rapid_fire: 1-2 sentences (quick exchanges, phone, arguments)
- normal: 2-4 sentences (regular chat)
- slow_burn: 4-8 sentences (emotional, intimate, detailed)
- contemplative: 6+ sentences (reflection, alone)

CLOTHING TRACKING (track every item):
Structure: "appearance.clothes_details.item_name": {state, position, fastened, condition, visibility}
- state: worn, removed, loosened, shifted, torn
- position: normal, pulled_up, pulled_down, askew
- fastened: true/false
- condition: pristine, wrinkled, disheveled, torn
- visibility: hidden, visible, partially_visible

Common items: shirt, pants, skirt, dress, bra, panties, underwear, socks, shoes
Body exposure: none (clothed) → partial (some skin) → significant (underwear visible) → intimate (private areas exposed)

RESPONSE FORMAT (JSON only):
{
  "state_updates": {
    "conversation.mode": "mode_name",
    "conversation.pacing": "pacing_type",
    "conversation.response_length": "brief|balanced|detailed",
    "pov.current_character": "name (if POV switches)",
    "character.mood": "emotion",
    "scene.scene_intensity": "calm|tense|intimate|action|emotional",
    "environment.privacy_level": "public|semi_private|private|intimate",
    "appearance.clothes_details.item": {details},
    "appearance.body_exposure": "level"
  },
  "context_summary": "Brief 1-2 sentence instruction for roleplay model"
}

EXAMPLES:

User: "I call her"
→ {"state_updates": {"conversation.mode": "phone_call", "conversation.pacing": "normal"}, "context_summary": "Character answers phone call"}

User: "I text her 'hey'"
→ {"state_updates": {"conversation.mode": "text_message", "conversation.pacing": "rapid_fire"}, "context_summary": "Character receives text message"}

User: "She's wearing a schoolgirl uniform"
→ {"state_updates": {"appearance.clothes_details.blouse": {"state": "worn", "fastened": true, "visibility": "visible"}, "appearance.clothes_details.skirt": {"state": "worn", "fastened": true, "visibility": "visible"}, "appearance.clothes_details.bra": {"state": "worn", "visibility": "hidden"}, "appearance.clothes_details.panties": {"state": "worn", "visibility": "hidden"}, "appearance.body_exposure": "none"}, "context_summary": "Character wearing pristine schoolgirl uniform"}

User: "I unbutton her blouse"
→ {"state_updates": {"appearance.clothes_details.blouse": {"fastened": false}, "appearance.clothes_details.bra": {"visibility": "visible"}, "appearance.body_exposure": "partial", "scene.scene_intensity": "intimate"}, "context_summary": "Blouse unbuttoned, bra now visible"}

User: "She's not wearing panties"
→ {"state_updates": {"appearance.clothes_details.panties": {"state": "removed"}, "appearance.body_exposure": "intimate"}, "context_summary": "Character not wearing underwear beneath clothing - intimate exposure"}

RULES:
1. Always return valid JSON
2. Update clothing when mentioned
3. Auto-detect conversation mode from keywords (call/text/video)
4. Match pacing to situation urgency
5. Include clothing state in context_summary if relevant
6. Track underwear separately (visibility: hidden until outer clothes removed)`;
}

/**
 * Process message with LLM-A before sending to SillyTavern's default model
 */
async function processWithLLMA(userMessage) {
    const settings = extension_settings[extensionName];

    if (!settings.enabled) {
        return null; // Extension disabled
    }

    try {
        // Get current character info from SillyTavern context
        const context = getContext();
        const characterInfo = {
            name: context.name2 || "Character",
            description: context.description || "",
            personality: context.personality || ""
        };

        // Step 1: Call LLM-A for state analysis
        const llmAMessages = [
            {
                role: "system",
                content: buildLLMASystemPrompt(characterInfo)
            },
            {
                role: "user",
                content: `CURRENT STATE:\n${JSON.stringify(stateManager.state, null, 2)}\n\nRECENT MESSAGES:\n${stateManager.messageHistory.slice(-5).join("\n")}\n\nUSER INPUT:\n${userMessage}\n\nREMINDER: Always track clothing items in appearance.clothes_details with their current state (worn/removed/loosened/shifted/torn), position, fastening status, and condition. If character is wearing a schoolgirl uniform, track: blouse, skirt, bra, panties, socks, shoes individually. Update body_exposure based on what's removed/exposed.`
            }
        ];

        const llmAResponse = await llmClients.callLLMA(llmAMessages);

        // Parse LLM-A response
        let analysis;
        try {
            // Extract JSON from response
            const jsonMatch = llmAResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in LLM-A response");
            }
        } catch (error) {
            console.error("[RPG Chatbot] Failed to parse LLM-A response:", error);
            analysis = {
                state_updates: {},
                context_summary: "Continuing conversation",
                response_style: "balanced"
            };
        }

        // Show debug info if enabled
        if (settings.debug_mode) {
            console.log("[RPG Chatbot] LLM-A Analysis:", analysis);
            showDebugPanel(analysis);
        }

        // Step 2: Apply state updates
        applyStateUpdates(analysis.state_updates || {});

        // Step 3: Update message history
        stateManager.messageHistory.push(`User: ${userMessage}`);

        // Step 4: Handle memory compression if needed
        if (settings.memory_compression && stateManager.messageHistory.length > settings.compression_threshold) {
            await compressMemory();
        }

        // Step 5: Build context injection for SillyTavern's model
        const contextSummary = analysis.context_summary || "Continuing conversation";
        const modeInstructions = analysis.mode_instructions || "";
        
        // Safe access to state properties
        const pov = stateManager.state.pov || {};
        const conversation = stateManager.state.conversation || {};
        const character = stateManager.state.character || {};
        const environment = stateManager.state.environment || {};
        const scene = stateManager.state.scene || {};
        const appearance = stateManager.state.appearance || {};
        
        const povCharacter = pov.current_character || characterInfo.name;
        const conversationMode = conversation.mode || "in_person";
        const responseLength = conversation.response_length || "balanced";
        const pacing = conversation.pacing || "normal";

        // Build comprehensive clothing summary
        let clothingSummary = "";
        const clothesDetails = appearance.clothes_details || {};
        const bodyExposure = appearance.body_exposure || "none";
        
        if (Object.keys(clothesDetails).length > 0) {
            const worn = [];
            const removed = [];
            const loosened = [];
            const damaged = [];
            const underwearVisible = [];
            
            for (const [item, details] of Object.entries(clothesDetails)) {
                if (details.state === "worn") {
                    let desc = item;
                    if (details.position !== "normal") desc += ` (${details.position})`;
                    if (details.condition !== "pristine") desc += ` [${details.condition}]`;
                    if (!details.fastened) desc += " [unfastened]";
                    worn.push(desc);
                    
                    // Track if underwear is visible
                    if ((item.includes("bra") || item.includes("panties") || item.includes("underwear")) && details.visibility === "visible") {
                        underwearVisible.push(item);
                    }
                } else if (details.state === "removed") {
                    removed.push(item);
                } else if (details.state === "loosened" || details.state === "shifted") {
                    loosened.push(`${item} (${details.state})`);
                } else if (details.state === "torn") {
                    damaged.push(`${item} (torn)`);
                }
            }
            
            clothingSummary = "CLOTHING STATE:\n";
            if (worn.length > 0) clothingSummary += `Wearing: ${worn.join(", ")}\n`;
            if (removed.length > 0) clothingSummary += `Removed: ${removed.join(", ")}\n`;
            if (loosened.length > 0) clothingSummary += `Loosened/Shifted: ${loosened.join(", ")}\n`;
            if (damaged.length > 0) clothingSummary += `Damaged: ${damaged.join(", ")}\n`;
            if (underwearVisible.length > 0) clothingSummary += `⚠️ Underwear visible: ${underwearVisible.join(", ")}\n`;
            clothingSummary += `Body exposure: ${bodyExposure}`;
        } else {
            clothingSummary = "CLOTHING: Not tracked (no outfit specified yet)";
        }

        const stateContext = {
            mood: character.mood || "neutral",
            location: environment.location || "unknown",
            scene_intensity: scene.scene_intensity || "calm",
            conversation_mode: conversationMode,
            response_length: responseLength,
            pacing: pacing,
            pov_character: povCharacter,
            awareness: pov.awareness_level || "full",
            clothes_summary: clothingSummary
        };

        // Build comprehensive context injection
        let extensionPromptText = `[SCENE CONTEXT]\n`;
        extensionPromptText += `${contextSummary}\n`;
        extensionPromptText += `Mood: ${stateContext.mood} | Location: ${stateContext.location} | Intensity: ${stateContext.scene_intensity}\n`;
        extensionPromptText += `\n${stateContext.clothes_summary}\n`;
        
        // Get mode-specific instructions from dictionary
        const modeConfig = CONVERSATION_MODES[conversationMode];
        if (modeConfig && modeConfig.restricts.length > 0) {
            extensionPromptText += `\n[RESPONSE INSTRUCTIONS]\n`;
            extensionPromptText += `${modeConfig.instruction}\n`;
        }
        
        // Get pacing-specific instructions from dictionary
        const pacingConfig = PACING_TYPES[pacing];
        if (pacingConfig) {
            extensionPromptText += `${pacingConfig.instruction}\n`;
        }
        
        extensionPromptText += `\nMode: ${conversationMode} | Pacing: ${pacing} (${pacingConfig ? pacingConfig.sentences : '2-4'} sentences)\n`;
        
        // Add POV instruction if switched
        if (povCharacter !== characterInfo.name) {
            extensionPromptText += `\nPOV: Respond from ${povCharacter}'s perspective. Awareness level: ${stateContext.awareness}\n`;
        }
        
        extensionPromptText += `[END CONTEXT]\n`;

        // Use SillyTavern's extension prompt system
        context.setExtensionPrompt(MODULE_NAME, extensionPromptText, extension_prompt_types.IN_PROMPT, 0);

        if (settings.debug_mode) {
            console.log("[RPG Chatbot] Context injected:", extensionPromptText);
        }

        // Update state panel
        updateStatePanel();

        // Save state to chat metadata
        saveStateToMetadata();

        return analysis; // Return analysis for potential use

    } catch (error) {
        console.error("[RPG Chatbot] Error in LLM-A processing:", error);
        toastr.error(`RPG Chatbot error: ${error.message}`, "Error");
        return null;
    }
}

/**
 * Apply state updates from LLM-A
 */
function applyStateUpdates(updates) {
    for (const [path, value] of Object.entries(updates)) {
        const keys = path.split('.');
        let target = stateManager.state;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;
    }
}

/**
 * Compress old memories
 */
async function compressMemory() {
    const settings = extension_settings[extensionName];
    const keepRecent = 6;
    const toCompress = stateManager.messageHistory.slice(0, -keepRecent);

    if (toCompress.length === 0) return;

    const compressionPrompt = `Summarize the following conversation into 2-3 sentences, capturing key events and emotional moments:\n\n${toCompress.join("\n")}`;

    try {
        const summary = await llmClients.callLLMA([
            { role: "system", content: "You summarize conversations concisely." },
            { role: "user", content: compressionPrompt }
        ]);

        stateManager.compressedMemories.push({
            summary: summary,
            original_count: toCompress.length,
            timestamp: new Date().toISOString()
        });

        stateManager.messageHistory = stateManager.messageHistory.slice(-keepRecent);

        console.log(`[RPG Chatbot] Compressed ${toCompress.length} messages`);
    } catch (error) {
        console.error("[RPG Chatbot] Memory compression failed:", error);
    }
}

/**
 * Smart Context Replacement for LLM-B
 * This is THE KEY FUNCTION that actually saves tokens on LLM-B calls
 * 
 * Replaces SillyTavern's full chat history with:
 * 1. Compressed character card (key traits only)
 * 2. Compressed old messages (summaries)
 * 3. Recent messages (last 6 in full)
 * 4. Our state tracking context
 */
async function buildSmartContextForLLMB() {
    const settings = extension_settings[extensionName];
    const context = getContext();
    
    // Get mode setting
    const mode = settings.smart_context_mode || "auto";
    if (mode === "off") {
        return null; // Don't modify context, use SillyTavern's default
    }
    
    // Configuration based on mode
    const modeConfigs = {
        "minimal": { keepMessages: 3, charCardTokens: 150, includeCompressed: false },
        "balanced": { keepMessages: 6, charCardTokens: 300, includeCompressed: true },
        "aggressive": { keepMessages: 10, charCardTokens: 500, includeCompressed: true },
        "auto": { keepMessages: 6, charCardTokens: 300, includeCompressed: true }
    };
    
    const config = modeConfigs[mode] || modeConfigs["balanced"];
    
    try {
        // 1. Compress Character Card (HUGE savings!)
        let compressedCharCard = "";
        if (settings.compress_character_card && context.characterDescription) {
            const charDesc = context.characterDescription;
            
            // If char description is > target tokens, compress it
            const estimatedTokens = Math.ceil(charDesc.length / 4); // rough estimate
            if (estimatedTokens > config.charCardTokens) {
                const compressionPrompt = `Condense this character description to ${config.charCardTokens} tokens max, keeping ONLY:
- Name, age, key personality traits
- Current relationship with user
- Critical background facts
- Physical appearance (brief)

Character Description:
${charDesc}

Condensed version (${config.charCardTokens} tokens max):`;

                compressedCharCard = await llmClients.callLLMA([
                    { role: "system", content: "You extract key character information concisely." },
                    { role: "user", content: compressionPrompt }
                ]);
                
                if (settings.debug_mode) {
                    console.log(`[RPG Chatbot] Compressed char card: ${charDesc.length} → ${compressedCharCard.length} chars`);
                }
            } else {
                compressedCharCard = charDesc; // Small enough, keep as-is
            }
        }
        
        // 2. Get chat messages from SillyTavern context
        const chat = context.chat || [];
        const totalMessages = chat.length;
        
        // 3. Build smart context replacement
        let smartContext = {
            characterCard: compressedCharCard,
            compressedHistory: [],
            recentMessages: [],
            stateContext: ""
        };
        
        // 4. Include compressed memories (from our memory compression)
        if (config.includeCompressed && stateManager.compressedMemories.length > 0) {
            smartContext.compressedHistory = stateManager.compressedMemories.map(mem => ({
                summary: mem.summary,
                messageCount: mem.original_count
            }));
        }
        
        // 5. Keep recent messages in full
        const recentStart = Math.max(0, totalMessages - config.keepMessages);
        smartContext.recentMessages = chat.slice(recentStart).map(msg => ({
            role: msg.is_user ? "user" : "assistant",
            content: msg.mes,
            name: msg.name
        }));
        
        // 6. Add our state tracking as context (this replaces the need for old messages!)
        const state = stateManager.state;
        const character = state.character || {};
        const appearance = state.appearance || {};
        const environment = state.environment || {};
        const scene = state.scene || {};
        
        smartContext.stateContext = `[CURRENT STATE - Replaces old chat history]
Relationship: Affection ${character.affection}/10, Mood: ${character.mood} (${character.mood_intensity}/10)
Location: ${environment.location} (${environment.time_of_day}, ${environment.lighting} lighting)
Scene: ${scene.current_activity}, Intensity: ${scene.scene_intensity}
Clothing: ${appearance.clothes_details ? Object.keys(appearance.clothes_details).join(", ") : "Not tracked"}
Recent events: ${state.history?.important_events?.slice(-3).join("; ") || "None"}`;

        return smartContext;
        
    } catch (error) {
        console.error("[RPG Chatbot] Smart context building failed:", error);
        return null; // Fall back to normal context
    }
}

/**
 * Inject smart context into SillyTavern's prompt generation
 * This hooks into SillyTavern's CHAT_CHANGED and MESSAGE_SENT events
 */
async function injectSmartContext() {
    const settings = extension_settings[extensionName];
    if (!settings.enabled || !settings.inject_state_as_context) return;
    
    const smartContext = await buildSmartContextForLLMB();
    if (!smartContext) return; // Mode is "off" or error occurred
    
    const context = getContext();
    
    // Build replacement context text
    let replacementContext = "";
    
    // Add compressed character card
    if (smartContext.characterCard) {
        replacementContext += `[CHARACTER - Compressed]\n${smartContext.characterCard}\n\n`;
    }
    
    // Add compressed history
    if (smartContext.compressedHistory.length > 0) {
        replacementContext += `[HISTORY - Compressed]\n`;
        smartContext.compressedHistory.forEach((mem, i) => {
            replacementContext += `Earlier (${mem.messageCount} messages): ${mem.summary}\n`;
        });
        replacementContext += `\n`;
    }
    
    // Add current state
    if (smartContext.stateContext) {
        replacementContext += `${smartContext.stateContext}\n\n`;
    }
    
    // Add recent messages
    if (smartContext.recentMessages.length > 0) {
        replacementContext += `[RECENT CONVERSATION]\n`;
        smartContext.recentMessages.forEach(msg => {
            const speaker = msg.role === "user" ? context.name1 : msg.name;
            replacementContext += `${speaker}: ${msg.content}\n`;
        });
    }
    
    // Use SillyTavern's extension prompt system with HIGH PRIORITY
    // This will be injected BEFORE the normal chat history
    context.setExtensionPrompt(
        `${MODULE_NAME}_context`, 
        replacementContext, 
        extension_prompt_types.BEFORE_PROMPT, 
        100 // High priority
    );
    
    // Also hide the original chat history if in aggressive mode
    const mode = settings.smart_context_mode || "auto";
    if (mode === "minimal" || mode === "balanced") {
        // Use a second injection to tell LLM to prioritize our context
        const priorityInstruction = `[INSTRUCTION]
Focus on the compressed context above. The recent conversation shows the last few messages.
Earlier context has been summarized to save tokens while preserving key information.`;
        
        context.setExtensionPrompt(
            `${MODULE_NAME}_priority`,
            priorityInstruction,
            extension_prompt_types.IN_PROMPT,
            99
        );
    }
    
    if (settings.debug_mode) {
        console.log("[RPG Chatbot] Smart context injected:", replacementContext);
    }
}

/**
 * Save state to chat metadata
 */
function saveStateToMetadata() {
    if (!chat_metadata.rpg_chatbot) {
        chat_metadata.rpg_chatbot = {};
    }
    
    chat_metadata.rpg_chatbot.state = stateManager.state;
    chat_metadata.rpg_chatbot.messageHistory = stateManager.messageHistory;
    chat_metadata.rpg_chatbot.compressedMemories = stateManager.compressedMemories;
    
    saveMetadataDebounced();
}

/**
 * Get default state structure
 */
function getDefaultState() {
    return {
        character: { 
            mood: "neutral", 
            mood_intensity: 5, 
            affection: 5, 
            energy: 10,
            emotional_state: "calm",
            focus_on: "user"
        },
        appearance: { 
            clothes: [], 
            clothes_state: "pristine", 
            clothes_details: {}, 
            body_exposure: "none",
            visible_features: []
        },
        environment: { 
            location: "unknown", 
            time_of_day: "afternoon", 
            lighting: "normal",
            privacy_level: "public",
            nearby_people: []
        },
        scene: { 
            characters_present: [], 
            current_activity: "conversation", 
            pov_character: "", 
            scene_intensity: "calm",
            scene_type: "casual"
        },
        conversation: { 
            mode: "in_person",
            pacing: "normal",
            exchange_style: "dialogue_with_action",
            response_length: "balanced",
            turn_count: 0,
            topic: "general"
        },
        pov: {
            current_character: "",
            can_see: true,
            can_hear: true,
            can_touch: false,
            can_smell: false,
            awareness_level: "full"
        },
        history: { 
            recent_actions: [], 
            important_events: [],
            relationship_changes: []
        }
    };
}

/**
 * Merge saved state with default state (handles missing properties)
 */
function mergeState(savedState, defaultState) {
    const merged = JSON.parse(JSON.stringify(defaultState)); // Deep clone
    
    for (const key in savedState) {
        if (typeof savedState[key] === 'object' && !Array.isArray(savedState[key]) && savedState[key] !== null) {
            merged[key] = { ...defaultState[key], ...savedState[key] };
        } else {
            merged[key] = savedState[key];
        }
    }
    
    return merged;
}

/**
 * Load state from chat metadata
 */
function loadStateFromMetadata() {
    if (chat_metadata.rpg_chatbot && chat_metadata.rpg_chatbot.state) {
        // Merge saved state with default state to handle missing properties
        stateManager.state = mergeState(chat_metadata.rpg_chatbot.state, getDefaultState());
        stateManager.messageHistory = chat_metadata.rpg_chatbot.messageHistory || [];
        stateManager.compressedMemories = chat_metadata.rpg_chatbot.compressedMemories || [];
        console.log("[RPG Chatbot] State loaded from metadata");
    } else {
        // Initialize with default state
        stateManager.state = getDefaultState();
        console.log("[RPG Chatbot] Using default state");
    }
    updateStatePanel();
}

/**
 * Update state panel UI
 */
function updateStatePanel() {
    const settings = extension_settings[extensionName];
    if (!settings || !settings.show_state_panel) return;

    const panel = $("#rpg_state_panel");
    if (panel.length === 0) return;

    const state = stateManager.state;
    
    // Safe access with fallbacks
    const character = state.character || {};
    const environment = state.environment || {};
    const scene = state.scene || {};
    const conversation = state.conversation || {};
    const pov = state.pov || {};
    const appearance = state.appearance || {};

    $("#rpg_mood").text(`${character.mood || "neutral"} (${character.mood_intensity || 5}/10)`);
    $("#rpg_affection").text(character.affection || 5);
    $("#rpg_location").text(environment.location || "unknown");
    $("#rpg_intensity").text(scene.scene_intensity || "calm");
    $("#rpg_conversation_mode").text(conversation.mode || "in_person");
    $("#rpg_pacing").text(conversation.pacing || "normal");
    $("#rpg_pov").text(pov.current_character || "Main Character");

    // Update clothes display
    const clothesDetails = appearance.clothes_details || {};
    if (Object.keys(clothesDetails).length > 0) {
        let clothesHtml = "";
        for (const [item, details] of Object.entries(clothesDetails)) {
            const stateIcon = details.state === "worn" ? "👕" : details.state === "removed" ? "🚫" : "⚠️";
            clothesHtml += `<div class="rpg-clothes-item">${stateIcon} ${item}: ${details.state}</div>`;
        }
        $("#rpg_clothes").html(clothesHtml);
    } else {
        $("#rpg_clothes").html('<span class="rpg-state-value">No details</span>');
    }
}

/**
 * Show debug panel with LLM-A analysis
 */
function showDebugPanel(analysis) {
    const debugHtml = `
        <div class="rpg_debug_panel">
            <h4>LLM-A Analysis</h4>
            <pre>${JSON.stringify(analysis, null, 2)}</pre>
        </div>
    `;

    const existingDebug = $(".rpg_debug_panel");
    if (existingDebug.length > 0) {
        existingDebug.replaceWith(debugHtml);
    } else {
        $("#rpg_state_panel").append(debugHtml);
    }
}

/**
 * Load extension settings
 */
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Update UI
    $("#rpg_enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#rpg_debug_mode").prop("checked", extension_settings[extensionName].debug_mode);
    $("#rpg_memory_compression").prop("checked", extension_settings[extensionName].memory_compression);
    $("#rpg_show_state_panel").prop("checked", extension_settings[extensionName].show_state_panel);

    $("#rpg_llm_a_provider").val(extension_settings[extensionName].llm_a_provider);
    $("#rpg_llm_a_api_key").val(extension_settings[extensionName].llm_a_api_key);
    $("#rpg_llm_a_model").val(extension_settings[extensionName].llm_a_model);
    $("#rpg_llm_a_temperature").val(extension_settings[extensionName].llm_a_temperature);
    $("#rpg_llm_a_max_tokens").val(extension_settings[extensionName].llm_a_max_tokens);

    // Smart Context Management settings
    $("#rpg_smart_context_mode").val(extension_settings[extensionName].smart_context_mode || "balanced");
    $("#rpg_compress_character_card").prop("checked", extension_settings[extensionName].compress_character_card !== false);
    $("#rpg_max_char_card_tokens").val(extension_settings[extensionName].max_char_card_tokens || 300);
    $("#rpg_inject_state_as_context").prop("checked", extension_settings[extensionName].inject_state_as_context !== false);

    // Toggle state panel visibility
    $("#rpg_state_panel").toggle(extension_settings[extensionName].show_state_panel);
    
    // Load state from metadata
    loadStateFromMetadata();
}

/**
 * Save setting
 */
function saveSetting(key, value) {
    extension_settings[extensionName][key] = value;
    saveSettingsDebounced();
}

/**
 * Reset state
 */
function resetState() {
    stateManager.state = getDefaultState();
    stateManager.messageHistory = [];
    stateManager.compressedMemories = [];
    stateManager.initialized = false;
    
    saveStateToMetadata();
    updateStatePanel();
    toastr.info("State reset", "RPG Chatbot");
}

// Event listeners and initialization
jQuery(async () => {
    // Load HTML using renderExtensionTemplateAsync (SillyTavern's preferred method)
    const settingsHtml = await renderExtensionTemplateAsync(extensionName, 'settings');
    const statePanelHtml = await renderExtensionTemplateAsync(extensionName, 'state_panel');

    // Append to extensions settings (right column for UI-related extensions)
    $("#extensions_settings2").append(settingsHtml);
    
    // Append state panel to sheld (persistent location that stays visible in chat)
    // If sheld doesn't exist, append to chat container
    const sheld = $("#sheld");
    if (sheld.length > 0) {
        sheld.append(statePanelHtml);
    } else {
        // Fallback to a persistent container
        $("#chat").parent().prepend(statePanelHtml);
    }

    // Bind events
    $("#rpg_enabled").on("input", (e) => saveSetting("enabled", Boolean($(e.target).prop("checked"))));
    $("#rpg_debug_mode").on("input", (e) => saveSetting("debug_mode", Boolean($(e.target).prop("checked"))));
    $("#rpg_memory_compression").on("input", (e) => saveSetting("memory_compression", Boolean($(e.target).prop("checked"))));
    $("#rpg_show_state_panel").on("input", (e) => {
        const checked = Boolean($(e.target).prop("checked"));
        saveSetting("show_state_panel", checked);
        $("#rpg_state_panel").toggle(checked);
    });

    $("#rpg_llm_a_provider").on("input", (e) => saveSetting("llm_a_provider", $(e.target).val()));
    $("#rpg_llm_a_api_key").on("input", (e) => saveSetting("llm_a_api_key", $(e.target).val()));
    $("#rpg_llm_a_model").on("input", (e) => saveSetting("llm_a_model", $(e.target).val()));
    $("#rpg_llm_a_temperature").on("input", (e) => saveSetting("llm_a_temperature", parseFloat($(e.target).val())));
    $("#rpg_llm_a_max_tokens").on("input", (e) => saveSetting("llm_a_max_tokens", parseInt($(e.target).val())));

    // Smart Context Management settings (THE MONEY SAVERS!)
    $("#rpg_smart_context_mode").on("input", (e) => saveSetting("smart_context_mode", $(e.target).val()));
    $("#rpg_compress_character_card").on("input", (e) => saveSetting("compress_character_card", Boolean($(e.target).prop("checked"))));
    $("#rpg_max_char_card_tokens").on("input", (e) => saveSetting("max_char_card_tokens", parseInt($(e.target).val())));
    $("#rpg_inject_state_as_context").on("input", (e) => saveSetting("inject_state_as_context", Boolean($(e.target).prop("checked"))));

    $("#rpg_reset_state").on("click", resetState);
    $("#rpg_toggle_panel").on("click", () => {
        $(".rpg-state-content").toggle();
        const icon = $("#rpg_toggle_panel");
        icon.text(icon.text() === "▼" ? "▲" : "▼");
    });

    // Hook into MESSAGE_SENT event to process with LLM-A before generation
    eventSource.on(event_types.MESSAGE_SENT, async (data) => {
        if (extension_settings[extensionName].enabled && data) {
            try {
                // Initialize state on first message
                if (!stateManager.initialized) {
                    loadStateFromMetadata();
                    stateManager.initialized = true;
                }
                
                // Process user message with LLM-A
                await processWithLLMA(data);
                
                // CRITICAL: Inject smart context to replace chat history for LLM-B
                // This is what actually saves tokens on premium models!
                await injectSmartContext();
                
                console.log("[RPG Chatbot] Message processed, smart context injected for SillyTavern's model");
            } catch (error) {
                console.error("[RPG Chatbot] Message processing error:", error);
            }
        }
    });

    // Hook into MESSAGE_RECEIVED to track bot responses
    eventSource.on(event_types.MESSAGE_RECEIVED, (data) => {
        if (extension_settings[extensionName].enabled && data) {
            const context = getContext();
            const characterName = context.name2 || "Character";
            const lastMessage = context.chat[context.chat.length - 1];
            
            if (lastMessage && lastMessage.is_user === false) {
                stateManager.messageHistory.push(`${characterName}: ${lastMessage.mes}`);
                saveStateToMetadata();
            }
        }
    });

    // Hook into CHAT_CHANGED to load state for new chat
    eventSource.on(event_types.CHAT_CHANGED, () => {
        loadStateFromMetadata();
        stateManager.initialized = true;
        console.log("[RPG Chatbot] Chat changed, state loaded");
    });

    // Load settings
    await loadSettings();

    console.log("[RPG Chatbot] Extension loaded successfully");
});
