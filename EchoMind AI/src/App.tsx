import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Loader2, Moon, Sun, Mic, Volume2, VolumeX, Play, StopCircle, MessageSquare, Plus, Trash2, Search, X, Copy, Pin, Edit2, Check, XCircle, Settings, ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import { generateAnswer } from './lib/openai';
import { useTheme } from './lib/theme';
import { SpeechHandler } from './lib/speech';
import { supabase, createConversation, saveMessage, toggleMessagePin, updateMessage } from './lib/supabase';
import { format } from 'date-fns';
import { useKeyboardShortcuts } from './lib/keyboard';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isPlaying?: boolean;
  isPinned?: boolean;
  isEditing?: boolean;
  category?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  category_id?: string;
}

function App() {
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const speechHandler = useRef<SpeechHandler>(new SpeechHandler());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      if (!currentConversation && data?.length === 0) {
        const newConv = await createNewConversation();
        setCurrentConversation(newConv);
      } else if (!currentConversation && data?.length > 0) {
        setCurrentConversation(data[0]);
        loadMessages(data[0].id);
      }
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []).map(msg => ({
        id: msg.id,
        text: msg.content,
        isBot: msg.role === 'assistant',
        timestamp: new Date(msg.created_at),
        isPinned: msg.is_pinned
      })));
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await createConversation();
      setConversations(prev => [newConversation, ...prev]);
      setMessages([]);
      setError(null);
      return newConversation;
    } catch (err) {
      setError('Failed to create new conversation');
      console.error('Error creating conversation:', err);
      throw err;
    }
  };

  useKeyboardShortcuts({
    onSubmit: () => {
      if (input.trim()) {
        handleSubmit(new Event('submit') as any);
      }
    },
    onClearInput: () => setInput(''),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onNewChat: createNewConversation
  });

  const deleteConversation = async (id: string) => {
    try {
      await supabase.from('conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversation?.id === id) {
        const nextConv = conversations.find(conv => conv.id !== id);
        setCurrentConversation(nextConv || null);
        if (nextConv) {
          loadMessages(nextConv.id);
        } else {
          setMessages([]);
          createNewConversation();
        }
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let conv = currentConversation;
    if (!conv) {
      try {
        conv = await createNewConversation();
        setCurrentConversation(conv);
      } catch (err) {
        setError('Failed to create conversation');
        return;
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      await saveMessage(input, 'user', conv.id);
      const response = await generateAnswer(input);
      
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: response,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      await saveMessage(response, 'assistant', conv.id);

      if (isSpeaking) {
        speechHandler.current.speak(response, {
          rate: 1,
          onEnd: () => console.log('Speech ended')
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error in conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      speechHandler.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechHandler.current.startListening(
        (text) => {
          setInput(text);
          setIsListening(false);
        },
        (error) => {
          setError(error);
          setIsListening(false);
        }
      );
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      speechHandler.current.stopSpeaking();
    }
    setIsSpeaking(!isSpeaking);
  };

  const playMessage = (messageId: string) => {
    speechHandler.current.stopSpeaking();
    setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));

    const message = messages.find(m => m.id === messageId);
    if (message) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPlaying: true } : msg
      ));

      speechHandler.current.speak(message.text, {
        rate: 1,
        onEnd: () => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isPlaying: false } : msg
          ));
        }
      });
    }
  };

  const stopPlayback = (messageId: string) => {
    speechHandler.current.stopSpeaking();
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPlaying: false } : msg
    ));
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      await toggleMessagePin(messageId, !isPinned);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, isPinned: !isPinned } : msg
      ));
    } catch (err) {
      setError('Failed to pin message');
      console.error('Error pinning message:', err);
    }
  };

  const startEditing = (messageId: string, text: string) => {
    setEditingMessage(messageId);
    setEditText(text);
  };

  const handleEditSave = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      await updateMessage(messageId, { content: editText });
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, text: editText } : msg
      ));
      setEditingMessage(null);
    } catch (err) {
      setError('Failed to update message');
      console.error('Error updating message:', err);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex text-gray-900 dark:text-gray-100">
      {/* History Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ${isHistoryOpen ? 'translate-x-0' : '-translate-x-72'} z-20`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewConversation}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history... (⌘K)"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-[calc(100vh-144px)]">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`p-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group ${
                currentConversation?.id === conv.id ? 'bg-blue-50 dark:bg-gray-700' : ''
              }`}
              onClick={() => {
                setCurrentConversation(conv);
                loadMessages(conv.id);
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(conv.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isHistoryOpen ? 'ml-72' : ''}`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                {isHistoryOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              <Bot className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">EchoMind AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeaking}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isSpeaking ? (
                  <Volume2 className="w-5 h-5 text-blue-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Welcome to EchoMind AI</h2>
              <p className="text-gray-600 dark:text-gray-400">Start a conversation and I'll be happy to help!</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isBot 
                    ? 'bg-blue-100 dark:bg-blue-900/50' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {message.isBot ? (
                    <Bot className="w-5 h-5 text-blue-500" />
                  ) : (
                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] relative group ${
                  message.isBot 
                    ? 'bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {editingMessage === message.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <XCircle className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEditSave(message.id)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Check className="w-5 h-5 text-green-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-50">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyMessage(message.text)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePinMessage(message.id, !!message.isPinned)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          message.isPinned ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      {!message.isBot && (
                        <button
                          onClick={() => startEditing(message.id, message.text)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => message.isPlaying ? stopPlayback(message.id) : playMessage(message.id)}
                        className={`ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          message.isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {message.isPlaying ? (
                          <StopCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Play className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-full w-10 h-10 flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;