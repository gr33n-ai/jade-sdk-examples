# Jade SDK React Native Example

A complete React Native (Expo) example app demonstrating the Jade SDK for AI-powered media generation.

## Features

- Chat interface with streaming responses
- Image generation with custom tool UI
- Media gallery with generated content
- Settings screen for API key configuration
- Persistent conversation storage

## Prerequisites

- Node.js 18+
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (Mac) or Android Emulator

## Installation

```bash
npm install
```

## Configuration

You need a Jade API key to use this app. Get one from your [organization dashboard](https://jade.gr33n.ai/dashboard/org/).

### Option 1: Environment Variable

Create a `.env.local` file:

```bash
JADE_AUTH_TOKEN=your_api_key_here
```

### Option 2: Settings Screen

Enter your API key in the app's Settings tab.

## Running the App

```bash
# Start the Expo dev server
npm start

# Or run directly on a platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

## Project Structure

```
.
├── App.tsx                 # Main app with navigation setup
├── components/
│   ├── ChatScreen.tsx      # Main chat interface
│   ├── MediaGallery.tsx    # Generated media gallery
│   ├── SettingsScreen.tsx  # API key configuration
│   ├── MessageBubble.tsx   # Chat message rendering
│   └── tool-ui/            # Custom tool UI components
│       ├── index.ts        # Tool registration
│       ├── registry.ts     # Dynamic tool UI registry
│       ├── ToolUI.tsx      # Tool UI dispatcher
│       └── GenerativeImageToolUI.tsx  # Image generation UI
├── types/
│   └── index.ts            # TypeScript type definitions
└── utils/
    └── toolNames.ts        # Human-readable tool names
```

## Key Concepts

### JadeProvider

The app is wrapped with `JadeProvider` which provides the Jade client context:

```tsx
<JadeProvider
  config={{
    endpoint: 'https://api.gr33n.ai',
    getAuthToken: async () => await getApiKey(),
  }}
  storage={storage}
>
  <App />
</JadeProvider>
```

### useJadeSession Hook

The main hook for chat functionality:

```tsx
const {
  processedConversation,  // Processed entries for display
  media,                   // Generated media
  isStreaming,             // Streaming state
  sendMessage,             // Send a message
  cancel,                  // Cancel current stream
} = useJadeSession();
```

### Tool UI System

Custom tool UIs are registered dynamically:

```tsx
// Register a custom tool UI
registerToolUI('mcp__jade__generative_image', GenerativeImageToolUI);

// The ToolUI component dispatches to registered handlers
<ToolUI entry={entry} toolName={toolName} />
```

## Documentation

- [Jade SDK Documentation](https://docs.gr33n.ai)
- [React Native Quickstart](https://docs.gr33n.ai/quickstart/react-native)
- [Storage Adapters](https://docs.gr33n.ai/react-native/storage)

## License

MIT
