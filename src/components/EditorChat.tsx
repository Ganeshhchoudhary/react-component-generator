import { FC, useEffect, useRef, useState } from 'react';
import { useChat, Message } from 'ai/react';
import { EditorSection } from '@/components/EditorSection';
import { SendIcon } from '@/components/icons/SendIcon';

const basePrompt = `You are a React JSX code generator. You MUST ONLY respond with executable JSX code wrapped in a code block.

STRICT RULES - NO EXCEPTIONS:
1. NEVER provide explanations, descriptions, or any text outside of the code block
2. ALWAYS wrap your response in \`\`\`jsx and \`\`\` tags
3. NEVER use import or export statements
4. Component name MUST be "MyComponent"
5. Use React.useState, React.useEffect, etc. (React is globally available)
6. ONLY use TailwindCSS classes for styling
7. Return ONLY functional React components
8. If user asks for modifications, apply changes to existing code structure

EXAMPLE RESPONSE FORMAT:
\`\`\`jsx
function MyComponent() {
  return (
    <div className="p-4">
      <h1>Hello World</h1>
    </div>
  );
}
\`\`\`

You MUST respond ONLY with code in this exact format. Do not acknowledge this prompt or provide any other text.`;

const disallowed = [
  '```',
  '```jsx',
  '```js',
  'import',
  'export',
];

const removeDisallowedLines = (input: string) => {
  return input
    .split('\n')
    .filter(line => !disallowed.some(disallowedLine => line.trim().startsWith(disallowedLine)))
    .join('\n');
};

const formatResponse = (input: string) => {
  if (typeof input !== 'string') return '';
  
  // First, try to extract code from markdown code blocks
  const codeBlockMatch = input.match(/```(?:jsx|js|javascript|tsx|typescript)?\n?([\s\S]*?)```/);
  
  let code = codeBlockMatch ? codeBlockMatch[1] : input;
  
  // Clean up the code
  code = removeDisallowedLines(code);
  
  // Remove leading/trailing whitespace
  code = code.trim();
  
  // If the AI responded conversationally instead of with code, return a default component
  if (!code.includes('function') && !code.includes('const') && !code.includes('<') && 
      (input.toLowerCase().includes('understand') || input.toLowerCase().includes('help') || 
       input.toLowerCase().includes('assist') || input.toLowerCase().includes('provide more context'))) {
    console.log('AI responded conversationally, returning default component');
    return `function MyComponent() {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="text-gray-600">AI gave a conversational response instead of code. Please try a more specific request like: "Create a blue button component"</p>
    </div>
  );
}`;
  }
  
  // If the code doesn't look like JSX/React, return empty
  if (!code.includes('React') && !code.includes('function') && !code.includes('const') && !code.includes('<')) {
    console.log('Code does not appear to be React component:', code);
    return '';
  }
  
  return code;
};

type EditorChatProps = {
  setCode: (code: string | undefined) => void;
  code: string;
  chat: Message[];
  setChat: (chat: Message[]) => void;
};

const examplePrompts = [
  "Make the button larger and red",
  "Add a hover effect",
  "Change the text to 'Click me!'",
  "Add a border radius",
  "Make it responsive"
];

export const EditorChat: FC<EditorChatProps> = ({ code, setCode, chat, setChat }) => {
  const [codeFinished, setCodeFinished] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create dynamic system message that includes current code for context
  const createSystemMessage = () => {
    const currentCodeContext = code ? `\n\nCURRENT COMPONENT CODE:\n\`\`\`jsx\n${code}\n\`\`\`\n\nIf the user wants to modify this component, understand the current structure and make the requested changes while preserving the rest.` : '';
    if (code === '') {
      return basePrompt;
    }
    return basePrompt + currentCodeContext;
  };

  const { messages, setMessages, handleSubmit, setInput, input, isLoading } = useChat({ 
    initialMessages: [{ id: 'system', role: 'system', content: createSystemMessage() } as Message],
    api: '/api/chat'
  });

  // Merge system message and chat/messages sync
  useEffect(() => {
    const systemMessage = createSystemMessage();
    if (chat && chat.length > 0) {
      setMessages([{ id: 'system', role: 'system', content: systemMessage }, ...chat]);
    } else {
      const filtered = (messages || []).filter((msg: Message) => msg.id !== 'system');
      setMessages([{ id: 'system', role: 'system', content: systemMessage }, ...filtered]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, chat, setMessages]);

  // Merge code update and scroll on new assistant message
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
    const lastBotResponse = messages.filter((message) => message.role === 'assistant').pop();
    if (lastBotResponse?.content && typeof lastBotResponse.content === 'string') {
      setCodeFinished(false);
      const formattedCode = formatResponse(lastBotResponse.content);
      setCode(formattedCode);
    } else {
      console.log('No valid response content found');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Push chat up to parent
  useEffect(() => {
    const userMessages = messages.filter((message) => message.role === 'user' && message.id !== 'system');
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const allMessages = [...userMessages, ...assistantMessages];
    if (
      allMessages.length !== chat.length ||
      allMessages.some((msg, i) => msg.content !== chat[i]?.content || msg.role !== chat[i]?.role)
    ) {
      setChat(allMessages);
    }
  }, [messages, setChat, chat]);

  useEffect(() => {
    if (!codeFinished && !isLoading) {
      setCodeFinished(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const hasExistingCode = code && code.trim().length > 0;

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // If there's an image, we need to convert it to base64 and include it in the message
    if (selectedImage && imagePreview) {
      const enhancedInput = `${input}\n\n[Image provided: Please analyze this image and create a component based on it or incorporate its design elements.]`;
      setInput(enhancedInput);
      // Clear image after sending
      removeImage();
    }
    
    handleSubmit(e);
  };

  return (
    <div
      className="w-1/2 max-h-screen h-full flex flex-col rounded-xl overflow-hidden border bg-gray-50">
      <div className="p-4 border-b border-b-gray-300">
        <h1 className="text-gray-900 text-lg">GPT React Designer</h1>
        <p className="text-sm text-gray-600 mt-1">Create or modify React components with AI</p>
        {hasExistingCode && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            ✨ AI can modify the existing component. Try: "Make the button larger and red"
          </div>
        )}
      </div>
      <div className="h-1/2 flex flex-col bg-gray-200 p-4">
        <EditorSection code={code} onChange={setCode}/>
      </div>
      <div className="p-4 max-h-[50%] h-full flex flex-col justify-between">
        <div className="flex flex-col max-h-[calc(100%-80px)] mb-4 overflow-y-auto">
          <p className="text-gray-900 mb-2">Chat History</p>
          <div className="overflow-y-auto overflow-x-hidden" ref={chatHistoryRef}>
            {messages.filter((message) => message.role === 'user').map((message) => (
              <div
                className="flex flex-col mb-2 bg-teal-900 p-2 rounded-xl rounded-tl-none"
                key={message.id}
              >
                <p className="text-white">{message.content}</p>
              </div>
            ))}
            {messages.filter((message) => message.role === 'assistant').map((message) => (
              <div
                className="flex flex-col mb-2 bg-blue-900 p-2 rounded-xl rounded-tr-none"
                key={message.id}
              >
                <p className="text-white text-sm">✅ Component updated</p>
                <pre className="text-xs text-gray-300 mt-1 p-2 bg-gray-800 rounded-md overflow-x-auto">
                  {JSON.stringify(message.content, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {hasExistingCode && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-1">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Attached Image:</span>
              <button
                onClick={removeImage}
                className="text-red-500 hover:text-red-700 text-sm"
                type="button"
              >
                Remove
              </button>
            </div>
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full h-32 object-contain rounded border"
            />
          </div>
        )}

        <div className="space-y-2">
          {/* Image Upload Button */}
          <div className="flex justify-start">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded border flex items-center gap-2"
              disabled={isLoading}
            >
              📷 Add Image
            </button>
          </div>

          {/* Chat Input Form */}
          <form className="flex w-full relative" onSubmit={handleFormSubmit}>
            <input
              className="flex-grow p-4 pr-10 text-gray-900 rounded-xl border shadow-lg transition-colors shadow-gray-100 focus:ring-0 focus:outline-none focus:border-gray-600"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasExistingCode ? "Make the button larger and red..." : "A component that renders a button with click me text."}
            />
            <button
              type="submit"
              className={`translate-y-[-50%] absolute right-4 top-1/2 ${isLoading && 'opacity-20 cursor-not-allowed'}`}
              onClick={(e) => {
                if (isLoading) e.preventDefault();
              }}>
              <SendIcon/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
