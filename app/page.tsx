import { CustomerServiceAvatar } from "@/components/customer-service-avatar"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  // Use a valid UUID for production or keep demo-user for testing
  // You could also generate a random UUID for anonymous users
  const userId = "demo-user"

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12">
      <ErrorBoundary>
        <CustomerServiceAvatar userId={userId} />
      </ErrorBoundary>
    </main>
  )
}
