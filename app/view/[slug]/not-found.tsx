import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50" />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Link Not Found</h1>
      <p className="mt-2 text-center text-muted-foreground">
        This share link doesn&apos;t exist or has been deactivated.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
