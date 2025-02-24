export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col sm:flex-row h-14 items-center justify-center sm:justify px-4">
        <p className="text-sm text-muted-foreground">Porta Dex © {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
