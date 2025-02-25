// #popclip
// name: InstantGrok
// icon: symbol:translate
// description: Use Grok API to translate selected text
// app: { name: Grok API, link: 'https://docs.x.ai/docs/tutorial' }
// popclipVersion: 4586
// keywords: translate, grok, xai
// entitlements: [network]

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
    valueLabels: [
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

// Format text, control characters per line, support automatic line breaks and handle long words
function formatText(text: string, maxCharsPerLine: number): string {
  // Ensure line width is a valid positive integer, default to 25
  const lineWidth = Number.isInteger(maxCharsPerLine) && maxCharsPerLine > 0
    ? maxCharsPerLine
    : 25;

  console.log(`Using line width: ${lineWidth}`);

  // If text length is less than or equal to line width, return original text
  if (text.length <= lineWidth) {
    return text;
  }

  let result = '';
  let currentLine = '';

  // Helper function: Split long words into multiple segments
  function splitLongWord(word: string): string[] {
    const segments: string[] = [];
    for (let i = 0; i < word.length; i += lineWidth) {
      segments.push(word.substring(i, i + lineWidth));
    }
    return segments;
  }

  // Detect if text is pure Chinese (including punctuation)
  const chinesePattern = /^[\u4e00-\u9fa5，。！？；：""''（）【】、]+$/;

  // If it's pure Chinese text, process by character
  if (chinesePattern.test(text)) {
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];

      // Only break line when current line reaches the set character limit
      if (currentLine.length >= lineWidth) {
        result += currentLine + '\n';
        currentLine = '';
      }
    }
  } else {
    // Process English or mixed Chinese-English text: split by spaces
    const words = text.split(' ');

    for (const word of words) {
      // If the word itself exceeds line width, it needs to be split
      if (word.length > lineWidth) {
        // If current line already has content, output current line first
        if (currentLine) {
          result += currentLine + '\n';
          currentLine = '';
        }

        // Split long word
        const segments = splitLongWord(word);
        for (let i = 0; i < segments.length - 1; i++) {
          result += segments[i] + '\n';
        }

        // Last segment becomes the start of a new line
        currentLine = segments[segments.length - 1];
      } else {
        // Try to add the word to current line
        const testLine = currentLine ? currentLine + ' ' + word : word;

        // If adding exceeds line width, break line
        if (testLine.length > lineWidth) {
          result += currentLine + '\n';
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
    }
  }

  // Ensure the last line is also added to the result
  if (currentLine) {
    result += currentLine;
  }

  return result;
}

// Show text in chunks function, for handling very long text
function showTextInChunks(text: string, maxLength: number = 500): void {
  console.log(`Total display text length: ${text.length}`);

  // If text length is within limit, display directly
  if (text.length <= maxLength) {
    popclip.showText(text);
    return;
  }

  // Display text in chunks
  let remainingText = text;
  let chunkNumber = 1;
  let totalChunks = Math.ceil(text.length / maxLength);

  while (remainingText.length > 0) {
    const currentChunk = remainingText.substring(0, maxLength);
    const displayText = `[${chunkNumber}/${totalChunks}] ${currentChunk}`;

    popclip.showText(displayText);

    // Give users some time to view current chunk
    // Note: Using setTimeout may not be suitable for PopClip environment
    // Should be changed to appropriate delay mechanism or user trigger

    remainingText = remainingText.substring(maxLength);
    chunkNumber++;
  }
}

// Translation main function
const translate: ActionFunction<Options> = async (input, options) => {
  const text = input.text.trim();

  if (!text) {
    popclip.showText("No text selected");
    return;
  }

  // Auto-detect language: If target language is Auto, determine if text contains Latin letters
  let targetLang = options.targetLang;
  if (targetLang === "Auto") {
    const isEnglish = /[a-zA-Z]/.test(text);
    targetLang = isEnglish ? "Chinese" : "English";
  }

  // Parse characters per line setting, ensure conversion to integer
  const lineWidth = parseInt(options.lineWidth);

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
    // Show loading status
    // popclip.showText("Translating...");

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
        max_tokens: 4096  // Increase token count to ensure complete response
      },
      timeout: 30000  // Increase timeout to 30 seconds
    });

    // Process the response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      // Get original translated text, without line breaks
      const translatedText = response.data.choices[0].message.content.trim();

      // Add formatted text display for all display modes
      const formattedDisplayText = formatText(translatedText, lineWidth);
      popclip.showText(formattedDisplayText);
      if (options.displayMode === "displayAndCopy") {
        // Content copied to clipboard without line breaks
        popclip.copyText(translatedText);
      }

    } else {
      popclip.showText("Translation failed: Invalid response data format");
    }
  } catch (error) {
    const errorMessage = getErrorInfo(error);
    popclip.showText(`Translation failed: ${errorMessage}`);
  }
};

// Error handling function
export function getErrorInfo(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as any).response;
    if (response && response.data && response.data.error) {
      return `API error (${response.status}): ${response.data.error.message}`;
    } else if (response && response.status) {
      return `API error: Status code ${response.status}`;
    }
  }

  if (error instanceof Error) {
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