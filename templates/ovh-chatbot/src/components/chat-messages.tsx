import { Message } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

type ChatMessagesProps = {
  messages: Message[];
};

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col container mx-auto overflow-auto p-4 gap-10">
      {messages.map((message, i) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`px-5 py-3 rounded-2xl max-w-[85%] md:max-w-[75%] ${
              message.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-white/10 backdrop-blur-sm border border-white/10 text-white"
            } ${i === messages.length - 1 ? "animate-fade-in" : ""}`}
          >
            <div className="mb-1 text-xs opacity-70">
              {message.role === "user" ? "You" : "OVH Assistant"}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
