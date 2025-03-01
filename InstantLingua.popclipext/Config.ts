// #popclip
// name: InstantLingua
// identifier: com.laurensent.popclip.extension.instant-lingua
// #icon: symbol:guitars.fill
// icon: symbol:brain.head.profile.fill
// popclipVersion: 4508
// description: LLM-Powered PopClip Extension for Translation & Writing
// app: { name: InstantLingua, link: 'https://github.com/laurensent/InstantLingua' }
// keywords: translate, grammar, reply
// entitlements: [network]
// ver: 0.5

import axios from "axios";

// Model configuration with labels
const modelOptions = {
  "openai": {
    values: [
      "gpt-4o-2024-08-06",
      "gpt-4o-mini-2024-07-18",
    ],
    valueLabels: [
      "GPT-4o",
      "GPT-4o-mini",
    ],
    defaultModel: "gpt-4o-mini-2024-07-18"
  },
  "anthropic": {
    values: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20240620", 
      "claude-3-5-haiku-20241022"
    ],
    valueLabels: [
      "Claude 3.7 Sonnet",
      "Claude 3.5 Sonnet", 
      "Claude 3.5 Haiku"
    ],
    defaultModel: "claude-3-5-sonnet-20240620"
  },
  "grok": {
    values: ["grok-2-1212"],
    valueLabels: ["Grok 2"],
    defaultModel: "grok-2-1212"
  },
  "gemini": {
    values: [
      "gemini-2.0-flash", 
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ],
    valueLabels: [
      "Gemini 2.0 Flash", 
      "Gemini 2.0 Flash-Lite",
      "Gemini 1.5 Flash",
      "Gemini 1.5 Pro"
    ],
    defaultModel: "gemini-1.5-pro"
  }
};

// Static options configuration
export const options = [
  {
    identifier: "splitMode",
    label: "Split Mode",
    type: "boolean",
    defaultValue: false,
    description: "Use separate buttons for tasks or one for all"
  },
  {
    identifier: "taskType",
    label: "Task",
    type: "multiple",
    defaultValue: "translate",
    values: ["translate", "grammar", "reply"],
    valueLabels: ["Translate", "Grammar Check", "Reply Suggestions"],
    description: "Select action to perform on text"
  },
  {
    identifier: "displayMode",
    label: "Display Mode",
    type: "multiple",
    values: ["display", "displayAndCopy"],
    valueLabels: ["Display Only", "Display and Copy"],
    defaultValue: "display"
  },
  {
    identifier: "provider",
    label: "AI Provider",
    type: "multiple",
    defaultValue: "grok",
    values: ["openai", "anthropic", "grok", "gemini"],
    valueLabels: ["OpenAI", "Claude (Anthropic)", "Grok (xAI)", "Gemini (Google)"]
  },
  {
    identifier: "openaiApiKey",
    label: "OpenAI API Key",
    type: "secret",
    description: "Get API Key from OpenAI: https://platform.openai.com",
    dependsOn: { provider: "openai" }
  },
  {
    identifier: "anthropicApiKey",
    label: "Anthropic API Key",
    type: "secret",
    description: "Get API Key from Anthropic: https://console.anthropic.com",
    dependsOn: { provider: "anthropic" }
  },
  {
    identifier: "grokApiKey",
    label: "Grok API Key",
    type: "secret",
    description: "Get API Key from xAI: https://x.ai",
    dependsOn: { provider: "grok" }
  },
  {
    identifier: "geminiApiKey",
    label: "Gemini API Key", 
    type: "secret",
    description: "Get API Key from Google AI Studio: https://aistudio.google.com",
    dependsOn: { provider: "gemini" }
  },
  {
    identifier: "grokModel",
    label: "xAI",
    type: "multiple",
    defaultValue: modelOptions.grok.defaultModel,
    values: modelOptions.grok.values,
    valueLabels: modelOptions.grok.valueLabels,
    dependsOn: { provider: "grok" },
  },
  {
    identifier: "anthropicModel",
    label: "Anthropic",
    type: "multiple",
    defaultValue: modelOptions.anthropic.defaultModel,
    values: modelOptions.anthropic.values,
    valueLabels: modelOptions.anthropic.valueLabels,
    dependsOn: { provider: "anthropic" },
  },
  {
    identifier: "geminiModel",
    label: "Google AI",
    type: "multiple",
    defaultValue: modelOptions.gemini.defaultModel,
    values: modelOptions.gemini.values,
    valueLabels: modelOptions.gemini.valueLabels,
    dependsOn: { provider: "gemini" },
  },
  {
    identifier: "openaiModel",
    label: "OpenAI",
    type: "multiple",
    defaultValue: modelOptions.openai.defaultModel,
    values: modelOptions.openai.values,
    valueLabels: modelOptions.openai.valueLabels,
    dependsOn: { provider: "openai" },
  },
  {
    identifier: "targetLang",
    label: "Target Language",
    type: "multiple",
    description: "Select target language for translation",
    defaultValue: "Chinese",
    values: [
      "English", 
      "Chinese", 
      "Spanish", 
      "Arabic", 
      "French", 
      "Russian", 
      "Portuguese", 
      "German", 
      "Japanese", 
      "Hindi", 
      "Korean", 
      "Italian", 
      "Dutch", 
      "Turkish", 
      "Vietnamese", 
      "Polish", 
      "Thai", 
      "Swedish"
    ],
    dependsOn: { taskType: "translate" },
  }
] as const;

type Options = InferOptions<typeof options>;

// Interface definitions
interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

// Response interfaces for different providers
interface GrokResponseData {
  choices: [{ message: { content: string } }];
}

interface AnthropicResponseData {
  content: [{ text: string }];
}

interface GeminiResponseData {
  candidates: [{
    content?: { parts: [{ text: string }] },
    text?: string
  }];
}

interface OpenAIResponseData {
  choices: [{ message: { content: string } }];
}

// API Configuration interface
interface ApiConfig {
  url: string;
  headers: Record<string, string>;
  data: Record<string, any>;
  extractContent: (data: any) => string;
}

// Function to detect if text is Chinese
function isChinese(text: string): boolean {
  // Check if text contains Chinese characters
  return /[\u4e00-\u9fff]/.test(text);
}

// Function to detect if text is primarily English
function isEnglish(text: string): boolean {
  // Check if text contains primarily English characters and spaces
  const nonEnglishChars = text.replace(/[a-zA-Z0-9\s.,?!;:'"()-]/g, '');
  // If less than 20% non-English characters, consider it English
  return (nonEnglishChars.length / text.length) < 0.2;
}

// Main function for all task types
const processText: ActionFunction<Options> = async (input, options) => {
  // Show initial loading indicator
  // popclip.showText("Processing...");
  
  const text = input.text.trim();

  if (!text) {
    popclip.showText("No text selected");
    return;
  }

  // Get the provider and check API key
  const provider = options.provider;
  const apiKey = getApiKey(options);
  
  if (!apiKey) {
    popclip.showText(`Please set ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key in extension settings`);
    return;
  }

  const model = getModelForProvider(options);
  
  // Check if model is selected
  if (!model) {
    popclip.showText(`No model selected for ${provider}. Please check settings.`);
    return;
  }

  // Get appropriate system prompt based on task type
  const taskType = options.taskType;
  let systemPrompt = "";
  let processingText = "";

  switch (taskType) {
    case "translate":
      const targetLang = options.targetLang;
      
      // Auto-detect and switch between Chinese and English
      if (targetLang === "Chinese" || targetLang === "English") {
        const isChineseText = isChinese(text);
        const isEnglishText = isEnglish(text);
        
        // If text is Chinese and target is Chinese, or text is English and target is English,
        // switch the target language to the opposite
        if ((isChineseText && targetLang === "Chinese") || (isEnglishText && targetLang === "English")) {
          const autoTargetLang = isChineseText ? "English" : "Chinese";
          systemPrompt = `You are a professional translator; please translate the user's text from ${isChineseText ? "Chinese" : "English"} to ${autoTargetLang}, emphasizing natural expression, clarity, accuracy, and fluency; don't add any explanations or comments.`;
          processingText = `Auto-detected ${isChineseText ? "Chinese" : "English"}, translating to ${autoTargetLang}...`;
        } else {
          // Use the selected target language as normal
          systemPrompt = `You are a professional translator; please translate the user's text to ${targetLang}, emphasizing natural expression, clarity, accuracy, and fluency; don't add any explanations or comments.`;
          processingText = `Translating to ${targetLang}...`;
        }
      } else {
        // For other target languages, keep the original behavior
        systemPrompt = `You are a professional translator; please translate the user's text to ${targetLang}, emphasizing natural expression, clarity, accuracy, and fluency; don't add any explanations or comments.`;
        processingText = `Translating to ${targetLang}...`;
      }
      break;
    case "grammar":
      systemPrompt = `You are a professional editor with expertise in proofreading. Carefully identify and fix all grammar, spelling, punctuation, and style issues in the text. Improve sentence structure and flow where needed, but maintain the original meaning. Only return the corrected text, with no explanations or annotations. If the text is already perfect, return it unchanged.`;
      processingText = "Grammar checking...";
      break;
    case "reply":
      systemPrompt = `You are an expert communication assistant. The text provided is a message someone has sent to the user. Draft an extremely concise, clear reply that addresses the key points effectively. Keep the response brief and to-the-point while maintaining professionalism. Use no more than 2-3 short sentences when possible. Return only the ready-to-send reply with no explanations or comments.`;
      processingText = "Drafting reply...";
      break;
    default:
      popclip.showText(`Invalid task type: ${taskType}`);
      return;
  }

  // Update loading indicator with specific task
  // popclip.showText(processingText);

  // Build request configuration based on provider
  const apiConfig = buildApiConfig(provider, apiKey, model, systemPrompt, text);

  try {
    // Create cancel token for request
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Set timeout to cancel request if it takes too long
    const timeoutId = setTimeout(() => {
      source.cancel('Request timeout');
    }, 30000);

    // Send API request
    const response = await axios({
      method: "POST",
      url: apiConfig.url,
      headers: apiConfig.headers,
      data: apiConfig.data,
      timeout: 30000,
      cancelToken: source.token
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);

    // Process the response using the provider-specific extraction function
    if (response.data) {
      try {
        const processedText = apiConfig.extractContent(response.data);
        
        // Display the text
        popclip.showText(processedText);
        if (options.displayMode === "displayAndCopy") {
          // Copy to clipboard
          popclip.copyText(processedText);
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        popclip.showText("Processing failed: Unexpected response format");
      }
    } else {
      popclip.showText("Processing failed: Empty response");
    }
  } catch (error) {
    // Check if this was a cancelation
    if (axios.isCancel(error)) {
      popclip.showText("Request canceled: Took too long");
    } else {
      const errorMessage = getErrorInfo(error);
      popclip.showText(`Processing failed: ${errorMessage}`);
    }
  }
};

// Simple provider configuration
interface ProviderConfig {
  getApiKey: (options: Options) => string;
  getModel: (options: Options) => string;
}

const providerConfigs: Record<string, ProviderConfig> = {
  "openai": {
    getApiKey: (options) => options.openaiApiKey,
    getModel: (options) => options.openaiModel
  },
  "anthropic": {
    getApiKey: (options) => options.anthropicApiKey,
    getModel: (options) => options.anthropicModel
  },
  "grok": {
    getApiKey: (options) => options.grokApiKey,
    getModel: (options) => options.grokModel
  },
  "gemini": {
    getApiKey: (options) => options.geminiApiKey,
    getModel: (options) => options.geminiModel
  }
};

// Helper functions
function getApiKey(options: Options): string {
  const provider = options.provider;
  return providerConfigs[provider]?.getApiKey(options) || "";
}

function getModelForProvider(options: Options): string {
  const provider = options.provider;
  return providerConfigs[provider]?.getModel(options) || "";
}

function buildApiConfig(
  provider: string, 
  apiKey: string, 
  model: string, 
  systemPrompt: string, 
  text: string
): ApiConfig {
  switch (provider) {
    case "grok":
      return {
        url: "https://api.x.ai/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        data: {
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          temperature: 0.3,
          max_tokens: 4096
        },
        extractContent: (data: GrokResponseData) => data.choices[0].message.content.trim()
      };
    
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        data: {
          model: model,
          system: systemPrompt,
          messages: [
            { role: "user", content: text }
          ],
          temperature: 0.3,
          max_tokens: 4096
        },
        extractContent: (data: AnthropicResponseData) => data.content[0].text.trim()
      };
    
    case "gemini":
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\nProcess the following text:\n\n" + text }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
          }
        },
        extractContent: (data: GeminiResponseData) => {
          try {
            // Gemini can have different response formats
            if (data.candidates && data.candidates[0]) {
              if (data.candidates[0].content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
              } else if (data.candidates[0].text) {
                return data.candidates[0].text.trim();
              }
            }
            // If we can't parse the expected format, try to extract some text
            return JSON.stringify(data).substring(0, 200) + "...";
          } catch (err) {
            console.error("Error extracting Gemini response:", err);
            throw new Error("Could not extract text from Gemini response");
          }
        }
      };
    
    case "openai":
      return {
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        data: {
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          temperature: 0.3,
          max_tokens: 4096
        },
        extractContent: (data: OpenAIResponseData) => data.choices[0].message.content.trim()
      };
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Error handling function
export function getErrorInfo(error: unknown): string {
  // Handle axios errors with response data
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as any).response;
    
    // Common error codes across providers
    if (response && response.status === 429) {
      return "Rate limit exceeded. Please try again later.";
    }
    
    if (response && response.status === 401 || response.status === 403) {
      return "Authentication failed. Please check your API key in settings.";
    }

    if (response && response.status === 400) {
      // Try to extract specific error based on provider format
      try {
        // Anthropic error format
        if (response.data && response.data.error) {
          if (response.data.error.type === "invalid_request_error") {
            return `Invalid request: ${response.data.error.message}`;
          }
          return `API error: ${response.data.error.message}`;
        }
        
        // Gemini error format
        if (response.data && response.data.error) {
          return `API error: ${response.data.error.message || JSON.stringify(response.data.error)}`;
        }
        
        // Grok/OpenAI format
        if (response.data && response.data.error) {
          return `API error: ${response.data.error.message || response.data.error.type}`;
        }
      } catch (parseError) {
        return `Bad request (${response.status})`;
      }
    }
    
    // Generic response error with status
    if (response && response.status) {
      return `API error: Status code ${response.status}`;
    }
  }

  // Handle common network errors
  if (error instanceof Error) {
    if (error.message.includes("Network Error")) {
      return "Network connection error. Please check your internet connection.";
    }
    
    if (error.message.includes("timeout")) {
      return "Request timed out. The service might be experiencing high load.";
    }
    
    // Provider-specific error detection
    if (error.message.includes("anthropic")) {
      return `Anthropic API error: ${error.message}`;
    }
    
    if (error.message.includes("gemini") || error.message.includes("googleapis")) {
      return `Gemini API error: ${error.message}`;
    }
    
    if (error.message.includes("x.ai")) {
      return `Grok API error: ${error.message}`;
    }
    
    if (error.message.includes("openai") || error.message.includes("api.openai.com")) {
      return `OpenAI API error: ${error.message}`;
    }
    
    return error.message;
  }

  return String(error);
}

// Export actions
export const actions: Action<Options>[] = [
  {
    title: "InstantLingua",
    icon: "symbol:brain.head.profile.fill",
    requirements: ["text", "option-splitMode=0"],
    code: processText,
  },
  {
    title: "Translate",
    icon: "symbol:translate",
    requirements: ["text", "option-splitMode=1"],
    code: (input, options) =>
      processText(input, { ...options, taskType: "translate" }),
  },
  {
    title: "Grammar Check",
    icon: "symbol:text.badge.checkmark",
    requirements: ["text", "option-splitMode=1"],
    code: (input, options) =>
      processText(input, { ...options, taskType: "grammar" }),
  },
  {
    title: "Reply Suggestions",
    icon: "symbol:lightbulb.fill",
    requirements: ["text", "option-splitMode=1"],
    code: (input, options) =>
      processText(input, { ...options, taskType: "reply" }),
  },
];