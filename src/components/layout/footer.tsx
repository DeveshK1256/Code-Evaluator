export function Footer() {
  return (
    <footer className="border-t py-4 px-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Code Evaluator. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
        </div>
      </div>
    </footer>
  );
}
