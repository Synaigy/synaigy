type WelcomeScreenProps = {
  onSuggestionClick: (suggestion: string) => void;
};

const suggestions = [
  "Tell me about OVH cloud solutions",
  "How do I configure a virtual machine?",
  "What are the hosting options?",
  "Explain OVH security features",
];

export default function WelcomeScreen({
  onSuggestionClick,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col w-full items-center justify-center flex-1 text-center gap-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        How can I help you today?
      </h3>
      <p className="text-white/60 max-w-md">
        Ask me anything about OVH services, cloud solutions, or technical
        support.
      </p>

      {/* Quick prompt suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-3 text-sm bg-white/10 hover:bg-white/15 text-white/80 rounded-lg text-left transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
