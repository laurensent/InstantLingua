// #popclip
// name: InstantLingua
// icon: symbol:translate
// description: Use multiple AI models to translate selected text
// app: { name: InstantLingua Translator, link: 'https://github.com/laurensent/InstantLingua' }
// popclipVersion: 4586
// keywords: translate, grok, claude, anthropic, gemini, openai, xai
// entitlements: [network]
// minOS: 14.0

import axios from "axios";

// Model configuration with labels
const modelOptions = {
  "grok": {
    values: ["grok-2-1212"],
    valueLabels: ["Grok 2"],
    defaultModel: "grok-2-1212"
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
  },
  "openai": {
    values: [
      "gpt-4o-2024-08-06",
      "gpt-4o-mini-2024-07-18",
    ],
    valueLabels: [
      "GPT-4o",
      "GPT-4o-mini",
    ],
    defaultModel: "gpt-4o-2024-08-06"
  }
};

// Static options configuration
export const options = [
  {
    identifier: "provider",
    label: "AI Provider",
    type: "multiple",
    defaultValue: "grok",
    values: ["grok", "anthropic", "gemini", "openai"],
    valueLabels: ["Grok (xAI)", "Claude (Anthropic)", "Gemini (Google)", "OpenAI"],
    description: "Select which AI provider to use"
  },
  {
    identifier: "grokApiKey",
    label: "Grok API Key",
    type: "secret",
    description: "Get API Key from xAI: https://x.ai",
    dependsOn: { provider: "grok" }
  },
  {
    identifier: "anthropicApiKey",
    label: "Anthropic API Key",
    type: "secret",
    description: "Get API Key from Anthropic: https://console.anthropic.com",
    dependsOn: { provider: "anthropic" }
  },
  {
    identifier: "geminiApiKey",
    label: "Gemini API Key", 
    type: "secret",
    description: "Get API Key from Google AI Studio: https://aistudio.google.com",
    dependsOn: { provider: "gemini" }
  },
  {
    identifier: "openaiApiKey",
    label: "OpenAI API Key",
    type: "secret",
    description: "Get API Key from OpenAI: https://platform.openai.com",
    dependsOn: { provider: "openai" }
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
  },
  {
    identifier: "displayMode",
    label: "Display Mode",
    type: "multiple",
    values: ["display", "displayAndCopy"],
    valueLabels: ["Display Only", "Display and Copy"],
    defaultValue: "display",
    description: "Display only or display and copy to clipboard",
  },
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

// No initialization required since we use static model lists

// Translation main function
const translate: ActionFunction<Options> = async (input, options) => {
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

  const targetLang = options.targetLang;
  const model = getModelForProvider(options);
  
  // Check if model is selected
  if (!model) {
    popclip.showText(`No model selected for ${provider}. Please check settings.`);
    return;
  }

  // Build request configuration based on provider
  const apiConfig = buildApiConfig(provider, apiKey, model, targetLang, text);

  try {
    // Show loading indication
    // popclip.showText("Translating...");

    // Create cancel token for request
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Set timeout to cancel request if it takes too long
    const timeoutId = setTimeout(() => {
      source.cancel('Translation request timeout');
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
        const translatedText = apiConfig.extractContent(response.data);
        
        // Display the text
        popclip.showText(translatedText);
        if (options.displayMode === "displayAndCopy") {
          // Copy to clipboard
          popclip.copyText(translatedText);
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        popclip.showText("Translation failed: Unexpected response format");
      }
    } else {
      popclip.showText("Translation failed: Empty response");
    }
  } catch (error) {
    // Check if this was a cancelation
    if (axios.isCancel(error)) {
      popclip.showText("Translation canceled: Request took too long");
    } else {
      const errorMessage = getErrorInfo(error);
      popclip.showText(`Translation failed: ${errorMessage}`);
    }
  }
};

// Simple provider configuration
interface ProviderConfig {
  getApiKey: (options: Options) => string;
  getModel: (options: Options) => string;
}

const providerConfigs: Record<string, ProviderConfig> = {
  "grok": {
    getApiKey: (options) => options.grokApiKey,
    getModel: (options) => options.grokModel
  },
  "anthropic": {
    getApiKey: (options) => options.anthropicApiKey,
    getModel: (options) => options.anthropicModel
  },
  "gemini": {
    getApiKey: (options) => options.geminiApiKey,
    getModel: (options) => options.geminiModel
  },
  "openai": {
    getApiKey: (options) => options.openaiApiKey,
    getModel: (options) => options.openaiModel
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
  targetLang: string, 
  text: string
): ApiConfig {
  // Common system message for all providers
  const systemPrompt = `You are a professional translator; please translate the user's text to ${targetLang}, emphasizing natural expression, clarity, accuracy, and fluency; don't add any explanations or comments.`;
  
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
                { text: systemPrompt + "\n\nTranslate the following text:\n\n" + text }
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
    title: "Translate",
    code: translate,
  }
];