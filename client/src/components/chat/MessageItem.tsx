import React from 'react';
import { Message } from '../../types';
import { FileText, Download } from 'lucide-react';
import { fileApi } from '../../api/file';

export const MessageItem: React.FC<{ message: Message; isCurrentUser: boolean }> = ({
  message,
  isCurrentUser,
}) => {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isImageFile = message.file && message.file.mimeType.startsWith('image/');

  return (
    <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] font-bold text-slate-400">
          {isCurrentUser ? 'You' : message.sender.name}
        </span>
        <span className="text-[10px] text-slate-500">{formattedTime}</span>
      </div>

      <div
        className={`max-w-[85%] rounded-2xl p-3 shadow-md space-y-2 text-xs leading-relaxed break-words ${
          isCurrentUser
            ? 'bg-brand-600 text-white rounded-tr-sm border border-brand-500/40'
            : 'bg-dark-800 text-slate-200 rounded-tl-sm border border-dark-700'
        }`}
      >
        {message.content && <p>{message.content}</p>}

        {/* File Attachment Card */}
        {message.file && (
          <div
            className={`p-2.5 rounded-xl flex flex-col gap-2 border ${
              isCurrentUser
                ? 'bg-brand-700/60 border-brand-400/30 text-white'
                : 'bg-dark-900 border-dark-700 text-slate-200'
            }`}
          >
            {isImageFile ? (
              <div className="space-y-1.5">
                <img
                  src={message.file.filePath}
                  alt={message.file.originalName}
                  className="max-h-48 rounded-lg object-cover w-full border border-white/10 cursor-pointer"
                  onClick={() => window.open(message.file!.filePath, '_blank')}
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="truncate max-w-[150px] font-medium">{message.file.originalName}</span>
                  <a
                    href={fileApi.getDownloadUrl(message.file.id)}
                    download
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-dark-950/80 shrink-0 text-brand-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate max-w-[140px] sm:max-w-[180px]">
                      {message.file.originalName}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {(message.file.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <a
                  href={fileApi.getDownloadUrl(message.file.id)}
                  download
                  className="p-1.5 rounded-lg bg-dark-950/60 hover:bg-dark-950 border border-white/10 text-slate-200 hover:text-white transition-colors shrink-0"
                  title="Download attachment"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
