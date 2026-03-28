export default function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-2">
      <span
        className="w-1.5 h-1.5 bg-fg-muted rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-fg-muted rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-fg-muted rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
}
