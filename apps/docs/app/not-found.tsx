import { Button } from '@/components/ui/button'
import { Link } from '@/lib/transition'

export default function NotFound() {
  return (
    <div className="flex min-h-[86.5vh] flex-col items-center justify-center px-2 py-8 text-center">
      <h1 className="mb-4 text-4xl font-bold sm:text-7xl">404</h1>
      <p className="mb-8 max-w-150 text-foreground sm:text-base">
        That document does not exist in FOM Docs.
      </p>
      <div className="flex items-center">
        <Button variant="default" size="lg" asChild>
          <Link title="Browse Docs" aria-label="Browse Docs" href="/docs/getting-started">
            Browse Docs
          </Link>
        </Button>
      </div>
    </div>
  )
}
