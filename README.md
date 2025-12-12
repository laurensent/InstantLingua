# InstantLingua  

![](/InstantLingua.png)

Inspired by the official [Instant Translate](https://www.popclip.app/extensions/x/08hhdb) and [OpenAI Chat](https://www.popclip.app/extensions/x/48f32j) extensions, **InstantLingua** is a powerful PopClip extension that provides seamless language assistance.  

With built-in support for **OpenAI, Claude, Grok, Gemini, and Ollama (local)**, InstantLingua enables instant translation, grammar correction, text rewriting, summarization, and smart reply suggestions—all directly within PopClip.

## Features

- **Instant Translation** – Quickly translate selected text between multiple languages
- **Bilingual Comparison** – Display original text alongside translation for easy reference (Note: Due to PopClip's display limitations, use "Display and Copy" or "Paste to Cursor" mode for full viewing)
- **Grammar Check** – Improve your writing with AI-powered grammar corrections (English Only)
- **Reply Suggestions** – Generate intelligent reply recommendations for messages and emails (English Only)
- **Text Rewrite** – Rewrite your text in different styles like professional, concise, or more descriptive
- **Summarize** – Get concise summaries of long texts
- **Custom Prompt** – Define your own AI instructions for custom text processing
- **Multi-Provider Support** – Use OpenAI, Claude, Grok, Gemini, or Ollama (local) models for language tasks
- **Paste Mode** – Paste results directly to cursor position
- **Dialog Window** – Display results in a floating panel for longer content
  - Floating panel appears near cursor
  - Bilingual view with language detection labels
  - Text-to-speech for original and translation
  - Quick copy buttons for each section
  - Click outside or press `Esc` to close, `Return` to confirm, `Cmd+C` to copy translation

## Tasks Overview

| Task | Type | Description |
|------|------|-------------|
| Translation | Bilingual | Convert text to target language |
| Grammar Check | Monolingual | Fix grammar and spelling errors |
| Reply Suggestions | Monolingual | Generate replies to messages |
| Rewrite | Monolingual | Rewrite text in different styles |
| Summary | Monolingual | Condense long text |
| Custom Prompt | Flexible | User-defined AI instructions |

## Rewrite Styles
InstantLingua offers several rewrite styles to enhance your text:

- **Improve** – General improvements to clarity and readability
- **Paraphrase** – Rephrase using different wording while preserving meaning
- **Shorten** – Condense text while maintaining key points
- **More Descriptive** – Add details and vivid language
- **Simplify** – Make text easier to understand with simpler vocabulary
- **Informative** – Add clarity and relevant context
- **More Fluent** – Improve flow and natural language
- **Professional** – Apply formal tone and structured phrasing


## Supported LLM Models

| Provider | Description | Model |
|----------|------------|-------|
| OpenAI | *GPT-4.1 | gpt-4.1-2025-04-14 |
| | GPT-4.1 mini | gpt-4.1-mini-2025-04-14 |
| | GPT-4.1 nano | gpt-4.1-nano-2025-04-14 |
| | GPT-5.1 | gpt-5.1-2025-11-13 |
| | GPT-5 mini | gpt-5-mini-2025-08-07 |
| | GPT-5 nano | gpt-5-nano-2025-08-07 |
| Anthropic | Claude Sonnet 4.5 | claude-sonnet-4-5-20250929 |
| | Claude Haiku 4.5 | claude-haiku-4-5-20251001 |
| | Claude Opus 4.5 | claude-opus-4-5-20251101 |
| xAI (Grok) | Grok 4.1 Fast | grok-4-1-fast-reasoning |
| | Grok 4.1 Fast (Non-Reasoning) | grok-4-1-fast-non-reasoning |
| Google | Gemini 3 Pro | gemini-3-pro-preview |
| | Gemini 2.5 Flash | gemini-2.5-flash |
| | Gemini 2.5 Flash-Lite | gemini-2.5-flash-lite |
| | Gemini 2.5 Pro | gemini-2.5-pro |
| Ollama | Local Models | Any installed model |

*Note: Model marked with * indicates the default model.

## Language Support

InstantLingua supports 32 languages for translation. Language quality varies by provider:

| Provider | Languages | Best For |
|----------|-----------|----------|
| OpenAI | 50+ | English, European, Asian languages |
| Anthropic | 30+ | English, European, Chinese, Japanese, Korean |
| Gemini | 100+ | Widest language coverage |
| Grok | 20+ | Major languages |
| Ollama | Varies | Depends on local model (e.g., Qwen for Chinese, Llama for English) |

InstantLingua enhances your PopClip experience with fast, AI-driven language tools.

## Installation

1. Download from [Releases](https://github.com/laurensent/InstantLingua/releases):
   - **InstantLingua.popclipextz** – Standard version with preset models
   - **InstantLingua-Dev.popclipextz** – Dev version with custom API endpoint and model ID support
2. Double-click the .popclipextz file to install
3. Configure your preferred AI provider API key in PopClip settings

## Setup

1. Open PopClip settings
2. Find InstantLingua in your extensions
3. Select your preferred model:
   - For cloud providers (OpenAI, Claude, Grok, Gemini): Enter your API key
   - For Ollama (local): Enter the model name (e.g., llama3.2, gpt-oss, mistral)
4. Enable/disable tasks as needed (Translation, Grammar Check, Reply Suggestions, Rewrite, Summary, Custom Prompt)
5. Configure task-specific options:
   - For translation: select target language and enable bilingual comparison if desired
   - For rewrite: choose your preferred rewrite style
   - For custom prompt: enter your custom AI instruction
6. Choose display mode: Display Only, Display and Copy, or Paste to Cursor
7. Adjust temperature settings if needed

### Ollama Setup

To use local models with Ollama:

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull your preferred model: `ollama pull llama3.2`
3. Ensure Ollama is running: `ollama serve`
4. In InstantLingua settings, select "Ollama (Local)" and enter the model name

## Privacy

InstantLingua takes your privacy seriously:

- **No Data Storage**: InstantLingua does not store or collect your API keys. Your API keys are securely saved locally in PopClip's settings and are only used to authenticate with the respective AI service providers.
- **No Usage Tracking**: The extension does not collect any data about how you use it or what text you process.
- **Direct API Communication**: Your selected text is sent directly to the AI provider's API (OpenAI, Claude, Grok, Gemini) or locally to Ollama.
- **Local Processing**: All operations occur locally on your device before and after API calls.
- **Transparent Code**: The extension's source code is open and available for review.

We respect your privacy and are committed to maintaining the security and confidentiality of your data.

## License

InstantLingua is available under the GPLv3 License. See the LICENSE file for details.