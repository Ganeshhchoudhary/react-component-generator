export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'React Component Generator'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free',
        messages,
        stream: false,
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate component' }), { 
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('OpenRouter response:', data);
    
    // Extract the message content from OpenRouter response
    const content = data.choices?.[0]?.message?.content || '';
    console.log('Extracted content:', content);
    
    // Return the content directly as text for the AI SDK
    return new Response(content, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
