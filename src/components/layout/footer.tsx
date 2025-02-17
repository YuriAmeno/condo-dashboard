export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-14 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Porta Dex © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}