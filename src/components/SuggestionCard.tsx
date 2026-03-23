interface SuggestionCardProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
}

const SuggestionCard = ({ suggestion, onClick }: SuggestionCardProps) => {
  return (
    <button
      onClick={() => onClick(suggestion)}
      className="glass-card rounded-xl p-4 text-left text-sm text-foreground hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-0 w-full group"
    >
      <span className="text-primary text-xs font-semibold block mb-1 group-hover:underline">✦ Sugestão</span>
      {suggestion}
    </button>
  );
};

export default SuggestionCard;