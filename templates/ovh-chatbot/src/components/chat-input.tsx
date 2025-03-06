import { ChangeEvent, FormEvent } from "react";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) {
  return (
    <div className="bg-blue-950/20 py-4 border-t border-blue-600/60 px-10">
      <div className="container mx-auto bg-blue-600/20 backdrop-blur-md border border-blue-600/50 rounded-xl overflow-hidden shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-center p-1">
          <input
            className="flex-1 bg-transparent text-white placeholder-white/40 border-0 px-4 py-3 focus:outline-none focus:ring-0"
            value={input}
            placeholder="Type your message..."
            onChange={handleInputChange}
            aria-label="Type your message"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 m-1 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-transparent"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
