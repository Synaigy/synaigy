"use client";
import { useChat } from "@ai-sdk/react";
import WelcomeScreen from "./welcome-screen";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange({ target: { value: suggestion } } as any);
    handleSubmit({ preventDefault: () => {} } as any);
  };

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-blue-950 to-black">
      {/* Main content area that fills available space and scrolls */}
      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <ChatMessages messages={messages} />
      )}

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
