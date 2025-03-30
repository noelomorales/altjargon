'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Volume2, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  id: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Whomp is a whitty French poet whose writing is a mix of Ocean Vuong and Charles Bernstein',
      id: 'system-prompt'
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      formData.append('file', file);

      const response = await fetch('/api/speech', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      setInput(data.text);
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      alert(error.message || 'Failed to transcribe audio');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error: any) {
      console.error('Error generating speech:', error);
      alert(error.message || 'Failed to generate speech');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      id: `user-${Date.now()}`
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const assistantMessage = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: assistantMessage.content,
          timestamp: Date.now(),
          id: `assistant-${Date.now()}`
        }
      ]);
    } catch (error) {
      console.error('Error getting completion:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
          id: `error-${Date.now()}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono" style={{
      backgroundImage: 'linear-gradient(to bottom, #0f0f0f 0%, #1e1e1e 100%)',
      fontSize: '14px'
    }}>
      <div className="mx-auto max-w-4xl p-4 border border-green-600 rounded-lg shadow-lg" style={{ boxShadow: '0 0 20px #0f0' }}>
        <div className="border-b border-green-600 p-2 flex justify-between items-center bg-green-900/30">
          <h1 className="text-xl">WhompAmp Chat</h1>
          <span className="text-xs text-green-300">Streaming AI Poetry in .MP3 quality</span>
        </div>

        <div className="h-[700px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
            {messages.slice(1).map((message) => (
              <div
                key={message.id}
                className={`flex items-start ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="mr-2 text-green-300">
                    <Bot size={18} />
                  </div>
                )}

                <div className={`max-w-[70%] px-3 py-2 border ${message.role === 'user' ? 'bg-green-700 text-black border-green-400' : 'bg-black text-green-300 border-green-700'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && (
                    <div className="text-[10px] text-green-500 mt-1 text-right">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="ml-2 text-green-300">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center space-x-2 text-green-400">
                <Bot size={18} />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="bg-green-900/40 p-2 flex items-center space-x-2 border-t border-green-600">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 bg-black border border-green-600 text-green-200 placeholder-green-400 focus:outline-none focus:ring focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 border ${isRecording ? 'bg-red-700 border-red-500 text-white' : 'bg-black border-green-600 text-green-400'}`}
              disabled={isLoading}
            >
              {isRecording ? <Square size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="submit"
              className="p-2 bg-green-700 text-black border border-green-300 hover:bg-green-600"
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
