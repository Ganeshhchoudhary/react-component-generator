import { FC, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

export const Preview: FC<{ code: string | null }> = ({ code }) => {
  const iframe = useRef<HTMLIFrameElement | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'jsx' | 'css'>('preview');

  useEffect(() => {
    if (!iframe.current) return;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { background: #fff; margin: 0; overflow: hidden; }</style>
        </head>
        <body style="background-color:#222222">
          <div id="root" style="padding: 16px;"></div>
          <script type="text/javascript">${code || ''}</script>
          <script type="text/javascript">
          ReactDOM.render(React.createElement(MyComponent), document.getElementById('root'));
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    iframe.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [code]);

  // Apply syntax highlighting when tab changes
  useEffect(() => {
    if (activeTab === 'jsx' || activeTab === 'css') {
      Prism.highlightAll();
    }
  }, [activeTab, code]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadAsZip = async () => {
    if (!code) return;
    
    const zip = new JSZip();
    
    // Add JSX file
    zip.file('MyComponent.jsx', code);
    
    // Add CSS file (extract Tailwind classes or create a basic CSS file)
    const cssContent = `/* Component styles */
/* This component uses Tailwind CSS classes */`;
    zip.file('styles.css', cssContent);
    
    // Add README
    const readmeContent = `# React Component

This component was generated using GPT React Designer.

## Files:
- MyComponent.jsx - The React component
- styles.css - Component styles (uses Tailwind CSS)

## Usage:
1. Install Tailwind CSS in your project
2. Import and use the component: \`import MyComponent from './MyComponent.jsx'\`
`;
    zip.file('README.md', readmeContent);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'react-component.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const extractCSS = (jsxCode: string) => {
    // Extract Tailwind classes from the JSX code
    const classMatches = jsxCode.match(/className="([^"]*)"/g);
    if (!classMatches) return '/* No CSS classes found */';
    
    const classes = classMatches.map(match => 
      match.replace('className="', '').replace('"', '')
    ).join(' ');
    
    return `/* Tailwind CSS classes used in this component: */
/* ${classes} */

/* To use these styles, ensure Tailwind CSS is installed in your project */`;
  };

  return (
    <div className="w-1/2 rounded-xl overflow-hidden border bg-[#222222] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview' 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('jsx')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'jsx' 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          JSX/TSX
        </button>
        <button
          onClick={() => setActiveTab('css')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'css' 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          CSS
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'preview' && (
          <iframe
            title="preview"
            ref={iframe}
            sandbox="allow-scripts"
            width="100%"
            height="100%"
          />
        )}
        
        {activeTab === 'jsx' && (
          <div className="p-4 bg-gray-900 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg">JSX/TSX Code</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(code || '')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <button
                  onClick={downloadAsZip}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download ZIP
                </button>
              </div>
            </div>
            <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto h-[calc(100%-60px)]">
              <code className="language-jsx">{code || '// No code generated yet'}</code>
            </pre>
          </div>
        )}
        
        {activeTab === 'css' && (
          <div className="p-4 bg-gray-900 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg">CSS</h3>
              <button
                onClick={() => copyToClipboard(extractCSS(code || ''))}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto h-[calc(100%-60px)]">
              <code className="language-css">{extractCSS(code || '')}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
