import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, AlertTriangle } from 'lucide-react'

const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto text-center space-y-8 py-16">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-warning/10 text-warning">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. 
          Please check the URL or navigate back to the homepage.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Home className="h-5 w-5" />
          Back to Homepage
        </Link>
        <Link
          to="/search"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-6 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
          Search Profiles
        </Link>
      </div>

      <div className="rounded-lg bg-muted p-6">
        <h3 className="font-semibold mb-2">Looking for a profile?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Profiles are accessible at <code className="px-2 py-1 bg-background rounded text-sm">/@username</code>
        </p>
        <div className="space-y-2 text-left">
          <p className="text-sm">
            <strong>Examples:</strong>
          </p>
          <ul className="text-sm space-y-1">
            <li>
              <Link to="/@rizki" className="text-primary hover:underline">
                /@rizki
              </Link>
            </li>
            <li>
              <Link to="/@admin" className="text-primary hover:underline">
                /@admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage