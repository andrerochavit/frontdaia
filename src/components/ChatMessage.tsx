import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp?: string;
}

const ChatMessage = ({ message, isBot, timestamp }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex flex-col gap-1 max-w-[80%]",
      isBot ? "items-start" : "items-end ml-auto"
    )}>
      <div className={cn(
        "rounded-lg px-4 py-3 text-sm",
        isBot 
          ? "bg-bot-message text-foreground" 
          : "bg-user-message text-primary-foreground"
      )}>
        {message}
      </div>
      {timestamp && (
        <span className="text-xs text-muted-foreground px-1">
          {timestamp}
        </span>
      )}
    </div>
  );
};

export default ChatMessage;