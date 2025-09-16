export default function LoadingDog() {
  return (
    <div className="flex items-center gap-2" data-testid="loading-dog">
      <span className="text-2xl animate-bounce" aria-hidden>
        🐶
      </span>
      <span className="text-sm text-muted-foreground">Fetching results…</span>
    </div>
  );
}
