export default function Footer() {
  return (
    <footer className="bg-muted border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Graphora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
