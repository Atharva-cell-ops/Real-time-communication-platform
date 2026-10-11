import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import { Message } from '../../types';
import { messageApi } from '../../api/message';
import { fileApi } from '../../api/file';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { MessageItem } from './MessageItem';

export interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  onNewMessage?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  meetingId,
  onNewMessage,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch past messages for this meeting
  useEffect(() => {
    if (!meetingId) return;

    const fetchHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await messageApi.getMeetingMessages(meetingId);
        setMessages(res.data);
      } catch (err: any) {
        console.error('[Chat Fetch Error]:', err);
      } finally {
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchHistory();
  }, [meetingId]);

  // Socket listener for real-time incoming chat messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: Message }) => {
      setMessages((prev) => {
        // Prevent duplicate messages if any
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });

      if (!isOpen && onNewMessage) {
        onNewMessage();
      }

      setTimeout(scrollToBottom, 100);
    };

    socket.on('chat:received', handleNewMessage);

    return () => {
      socket.off('chat:received', handleNewMessage);
    };
  }, [socket, isOpen, onNewMessage]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const content = inputText.trim();
    setInputText('');

    // Emit via Socket.io for immediate real-time broadcast and DB persistence
    socket.emit('chat:send', {
      meetingId,
      content,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      return;
    }

    setIsUploadingFile(true);
    setUploadProgress(0);

    try {
      const res = await fileApi.uploadFile(meetingId, file, (progress) => {
        setUploadProgress(progress);
      });

      // Broadcast message containing the attached file
      socket.emit('chat:send', {
        meetingId,
        content: `Uploaded file: ${file.name}`,
        fileId: res.data.id,
      });

      showToast('File uploaded and shared.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file.', 'error');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 sm:w-96 h-full bg-dark-900 border-l border-dark-800 flex flex-col z-30 shadow-2xl transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-100">In-Meeting Chat</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
            <p className="text-xs font-semibold text-slate-400">No messages yet</p>
            <p className="text-[11px]">Send a message or share a document with everyone in the room.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} isCurrentUser={msg.senderId === user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Progress Indicator */}
      {isUploadingFile && (
        <div className="px-4 py-2 bg-dark-950 border-t border-dark-800 flex items-center justify-between text-xs text-brand-400 font-medium">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Uploading attachment... {uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-dark-800 bg-dark-950/80 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingFile}
          className="p-2.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-dark-700 transition-colors disabled:opacity-50 shrink-0"
          title="Attach file (Max 10MB)"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white border border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20 active:scale-95 shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
