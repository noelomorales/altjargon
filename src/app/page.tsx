'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Volume2, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  id: string;
}

export default function BBMChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Whomp is a whitty French poet whose writing is a mix of Ocean Vuong and Charles Bernstein',
      id: 'system-prompt',
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
      if (!response.ok) throw new Error((await response.json()).error);
      const data = await response.json();
      setInput(data.text);
    } catch (error: any) {
      alert(error.message || 'Failed to transcribe audio');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const blob = await response.blob();
      new Audio(URL.createObjectURL(blob)).play();
    } catch (error: any) {
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
      id: `user-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const assistantMessage = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantMessage.content,
          timestamp: Date.now(),
          id: `assistant-${Date.now()}`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
          id: `error-${Date.now()}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative">
      {/* Background: stylized hands holding a phone */}
      <div className="absolute inset-0 bg-black bg-[url('/blackberry-hands.png')] bg-cover bg-center opacity-30 pointer-events-none" />

      {/* Phone shell */}
      <div className="w-[380px] h-[700px] bg-black rounded-[2rem] border-4 border-gray-800 shadow-2xl flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-[#003366] text-white p-3 text-sm font-semibold text-center border-b border-black">
          BlackBerry Messenger – Whomp
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-[#E6EDF3] px-3 py-2 overflow-y-auto space-y-3 text-sm font-sans">
          {messages.slice(1).map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-xl px-3 py-2 max-w-[75%] ${
                  message.role === 'user'
                    ? 'bg-[#C3D9FF] text-black'
                    : 'bg-white text-black'
                }`}
              >
                {message.content}
                {message.timestamp && (
                  <div className="text-[10px] text-gray-500 mt-1 text-right">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => speakText(message.content)}
                    className="mt-1 text-gray-500 hover:text-black"
                    aria-label="Text to speech"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start space-x-1 pl-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#003366] p-2 border-t border-black flex items-center space-x-2">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Type a message..."
              className="flex-1 bg-white text-black px-3 py-1 rounded-full text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full text-white ${
                isRecording ? 'bg-red-500' : 'bg-gray-700'
              }`}
              disabled={isLoading}
            >
              {isRecording ? <Square size={14} /> : <Mic size={14} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
