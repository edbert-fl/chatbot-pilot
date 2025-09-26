'use client';

interface ButtonGroupProps {
  title: string;
  options: Array<{
    label: string;
    value: string;
    flowId?: string;
  }>;
  selectionKey: string;
  onSelection: (selections: Record<string, unknown>) => void;
  onEnterFlow?: (flowId: string) => void;
}

export default function ButtonGroup({
  title,
  options,
  selectionKey,
  onSelection,
  onEnterFlow
}: ButtonGroupProps) {
  const handleClick = (option: { label: string; value: string; flowId?: string }) => {
    // Enter flow if specified
    if (option.flowId && onEnterFlow) {
      onEnterFlow(option.flowId);
    }

    // Send selection
    onSelection({ [selectionKey]: option.value });
  };

  return (
    <div className="space-y-2">
      <div className="inline-block text-xs px-2 py-1 border border-border rounded-full text-muted">
        {title}
      </div>
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleClick(option)}
            className="px-3 py-2 rounded border border-border bg-bg text-text hover:border-accent hover:text-accent transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
