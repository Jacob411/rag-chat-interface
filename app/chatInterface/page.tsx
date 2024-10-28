
"use client";

import React, { useState } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated API call - replace with your actual API
  const sendMessage = async (message) => {
    setIsLoading(true);

    const apiResponse = await fetch('http://localhost:8000/rag', {
      method: 'POST',
      body: JSON.stringify({ query : message }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await apiResponse.json();

    // set context based on the response by looping through the search results
    // and extracting the text and source and appending it to the context array
    let context = [];
    let answer = '';
    try {
      for (let i = 0; i < data.results.search_results.vector_search_results.length; i++) {
        const ctx = {
          text: data.results.search_results.vector_search_results[i].text,
          source: data.results.search_results.vector_search_results[i].metadata.title
        };
        context.push(ctx);
      }
      answer = data.results.completion.choices[0].message.content
     }
    catch (error) {
      console.error('Failed to extract context:', error);
      context = [];
      answer = 'Sorry, I had an issue processing your request';
    }


    setMessages(prev => [...prev, 
      { type: 'user', content: message },
      { type: 'bot', content: answer, context: context }
    ]);
    setIsLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };

  const ContextSection = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{isOpen ? "Hide" : "Show"} Context</span>
            <span className="text-xs text-gray-400">({context.length} sources)</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {context.map((ctx, index) => (
            <Alert key={index} className="mb-2">
              <AlertDescription>
                <p className="text-sm">{ctx.text}</p>
                <p className="text-xs text-gray-500 mt-1">Source: {ctx.source}</p>
              </AlertDescription>
            </Alert>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const MessageBubble = ({ message }) => {
    if (message.type === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-[80%]">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <div className="bg-gray-200 rounded-lg py-2 px-4 max-w-[80%]">
            {message.content}
          </div>
          
          {message.context && (
            <div className="ml-4">
              <ContextSection context={message.context} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen max-w-4xl mx-auto p-4 flex flex-col">
      <Card className="flex-grow flex flex-col">
        <CardContent className="flex-grow flex flex-col p-4">
          <ScrollArea className="flex-grow mb-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
