// #popclip
// name: InstantGrok
// icon: symbol:translate
// description: Use Grok API to translate selected text
// app: { name: Grok API, link: 'https://docs.x.ai/docs/tutorial' }
// popclipVersion: 4586
// keywords: translate, grok, xai
// entitlements: [network]
// minOS: 14.0

import axios from "axios";

export const options = [
  {
    identifier: "apiKey",
    label: "API Key",
    type: "secret",
    description: "Get API Key from xAI: https://x.ai",
  },
  {
    identifier: "model",
    label: "Model",
    type: "multiple",
    defaultValue: "grok-2-1212",
    values: ["grok-2-1212"],
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

interface ResponseData {
  choices: [{ message: Message }];
}

interface Response {
  data: ResponseData;
}


// Translation main function
const translate: ActionFunction<Options> = async (input, options) => {
  const text = input.text.trim();

  if (!text) {
    popclip.showText("No text selected");
    return;
  }

  if (!options.apiKey) {
    popclip.showText("Please set API Key in extension settings");
    return;
  }

  const targetLang = options.targetLang;

  // Build translation request message
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a professional translator; please translate the user's text to ${targetLang}, emphasizing natural expression, clarity, accuracy, and fluency; don't add any explanations or comments.`
    },
    {
      role: "user",
      content: text
    }
  ];

  try {
    // Show loading indication
    // Create cancel token for request
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Set timeout to cancel request if it takes too long
    const timeoutId = setTimeout(() => {
      source.cancel('Translation request timeout');
    }, 30000);

    // Send API request
    const response: Response = await axios({
      method: "POST",
      url: "https://api.x.ai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": options.apiKey
      },
      data: {
        model: options.model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 4096  // Ensure complete response
      },
      timeout: 30000,
      cancelToken: source.token
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);

    // Process the response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      // Get original translated text
      const translatedText = response.data.choices[0].message.content.trim();

      // Display the text
      popclip.showText(translatedText);
      if (options.displayMode === "displayAndCopy") {
        // Copy to clipboard
        popclip.copyText(translatedText);
      }

    } else {
      popclip.showText("Translation failed: Invalid response data format");
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

// Error handling function
export function getErrorInfo(error: unknown): string {
  // Handle axios errors with response data
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as any).response;
    
    // Check for rate limiting
    if (response && response.status === 429) {
      return "Rate limit exceeded. Please try again later.";
    }
    
    // Check for authorization errors
    if (response && response.status === 401) {
      return "Invalid API key. Please check your API key in settings.";
    }
    
    // Handle structured error responses
    if (response && response.data && response.data.error) {
      return `API error (${response.status}): ${response.data.error.message}`;
    } 
    
    // Generic response error with status
    if (response && response.status) {
      return `API error: Status code ${response.status}`;
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes("Network Error")) {
      return "Network connection error. Please check your internet connection.";
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