import { FC, useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { EditorSection } from '@/components/EditorSection';
import { SendIcon } from '@/components/icons/SendIcon';

const basePrompt = `You are a React component generator. You can create new components or modify existing ones based on user requests.

IMPORTANT RULES:
1. Only return JSX code, no descriptions or explanations
2. Do not import or export anything
3. Use React.[hook name] for hooks since React is global
4. Component should be named "MyComponent"
5. Use TailwindCSS for styling
6. If modifying existing code, preserve the structure and only change what's requested

When modifying existing code, understand the current component and make the requested changes while keeping the rest intact.`;

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
  return removeDisallowedLines(input);
};

type EditorChatProps = {
  setCode: (code: string) => void;
  code: string;
  chat: any[];
  setChat: (chat: any[]) => void;
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
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Create dynamic system message that includes current code for context
  const createSystemMessage = () => {
    const currentCodeContext = code ? `\n\nCURRENT COMPONENT CODE:\n\`\`\`jsx\n${code}\n\`\`\`\n\nIf the user wants to modify this component, understand the current structure and make the requested changes while preserving the rest.` : '';
    return basePrompt + currentCodeContext;
  };

  const { messages, setMessages, handleSubmit, setInput, input, isLoading } = useChat({ 
    initialMessages: [{ id: 'system', role: 'system', content: createSystemMessage() }]
  });

  // Update system message when code changes to provide context for iterative refinement
  useEffect(() => {
    const systemMessage = createSystemMessage();
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== 'system');
      return [{ id: 'system', role: 'system', content: systemMessage }, ...filtered];
    });
  }, [code, setMessages]);

  // Load chat from props when component mounts or chat changes
  useEffect(() => {
    if (chat && chat.length > 0) {
      const systemMessage = createSystemMessage();
      setMessages([{ id: 'system', role: 'system', content: systemMessage }, ...chat]);
    }
  }, [chat, setMessages, code]);

  // Save chat to parent when messages change
  useEffect(() => {
    const userMessages = messages.filter((message) => message.role === 'user' && message.id !== 'system');
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const allMessages = [...userMessages, ...assistantMessages];
    if (allMessages.length > 0) {
      setChat(allMessages);
    }
  }, [messages, setChat]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setCodeFinished(false);
    const lastBotResponse = messages.filter((message) => message.role === 'assistant').pop();
    if (lastBotResponse?.content) {
      const formattedCode = formatResponse(lastBotResponse.content);
      setCode(formattedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

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

        <form className="flex w-full relative" onSubmit={handleSubmit}>
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
  );
};
