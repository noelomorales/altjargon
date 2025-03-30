'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Volume2, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  id: string;
}

function ChatBox({
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
  isRecording,
  toggleRecording,
  speakText,
  title,
}: {
  messages: Message[];
  input: string;
  setInput: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isRecording: boolean;
  toggleRecording: () => void;
  speakText: (text: string) => void;
  title: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-black/80 border border-purple-500 rounded-lg p-4 w-full max-w-md text-purple-300 font-mono backdrop-blur-sm shadow-xl">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <div className="h-96 overflow-y-auto space-y-4 mb-2">
        {messages.slice(1).map((message) => (
          <div key={message.id} className={`text-sm ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-purple-900'}`}>
              {message.content}
            </div>
            {message.timestamp && (
              <div className="text-xs text-purple-400 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
            )}
            {message.role === 'assistant' && (
              <button onClick={() => speakText(message.content)} className="mt-1 text-purple-400 hover:text-purple-200">
                <Volume2 size={14} />
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={onSubmit} className="flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 bg-black border border-purple-700 text-purple-300 placeholder-purple-500 focus:outline-none"
          placeholder="Type..."
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-2 ${isRecording ? 'bg-red-600' : 'bg-purple-700'} text-white rounded`}
        >
          {isRecording ? <Square size={16} /> : <Mic size={16} />}
        </button>
        <button
          type="submit"
          className="p-2 bg-purple-500 text-white rounded disabled:opacity-50"
          disabled={!input.trim() || isLoading}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default function SpaceChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'Welcome to cosmic chat.', id: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0, y = 0;
    let t = 0;

    const animate = () => {
      t += 0.01;
      const gravityX = Math.sin(t * 0.7) * 30 + Math.sin(t * 1.3) * 20;
      const gravityY = Math.cos(t * 0.5) * 25 + Math.cos(t * 1.1) * 15;
      const dx = (x - gravityX) * 0.05;
      const dy = (y - gravityY) * 0.05;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      requestAnimationFrame(animate);
    };

    const updateMouse = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    document.addEventListener('mousemove', updateMouse);
    animate();

    return () => document.removeEventListener('mousemove', updateMouse);
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await transcribeAudio(blob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
    formData.append('file', file);
    const res = await fetch('/api/speech', { method: 'POST', body: formData });
    const data = await res.json();
    setInput(data.text || '');
    setIsLoading(false);
  };

  const speakText = async (text: string) => {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const blob = await res.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim(), id: `u-${Date.now()}`, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
    });

    const data = await res.json();
    const reply = { role: 'assistant', content: data.content, id: `a-${Date.now()}`, timestamp: Date.now() };
    setMessages((prev) => [...prev, reply]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden" style={{
      backgroundImage: `radial-gradient(#444 1px, transparent 1px), radial-gradient(#222 1px, transparent 1px)`,
      backgroundSize: '30px 30px',
      backgroundPosition: '0 0, 15px 15px'
    }}>
      <div ref={cursorRef} className="absolute top-0 left-0 w-full h-full pointer-events-none transition-transform duration-300 ease-out" />

      <div className="flex flex-col md:flex-row justify-center items-center gap-8 p-8 z-10 relative">
        <ChatBox
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isRecording={isRecording}
          toggleRecording={toggleRecording}
          speakText={speakText}
          title="Orbital Node α"
        />
        <ChatBox
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isRecording={isRecording}
          toggleRecording={toggleRecording}
          speakText={speakText}
          title="Orbital Node β"
        />
      </div>
    </div>
  );
}
