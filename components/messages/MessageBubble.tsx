import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime, cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    sender: { id: string; name: string; avatarUrl: string | null };
  };
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={cn('flex items-end gap-2 animate-fade-in', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {!isMine && (
        <Avatar name={message.sender.name} avatarUrl={message.sender.avatarUrl} size="xs" />
      )}
      <div className={cn('max-w-[75%] group', isMine ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isMine
              ? 'bg-isa-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
          )}
        >
          {message.text}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
