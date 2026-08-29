import { Link } from 'react-router-dom'
import { ArrowRight, Link as LinkIcon, Shield, Zap } from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: <LinkIcon className="h-6 w-6" />,
      title: 'Simple Link Management',
      description: 'Create, organize, and share your links in one place.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Internal platform with enterprise-grade security.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Built on Cloudflare Workers for instant loading.',
    },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto py-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Your Internal{' '}
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Link Sharing Platform
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simple, fast, and secure link sharing for your company. No external services, no complicated setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/@demo"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 py-3 text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View Demo Profile
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose LW-link?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted/50 rounded-2xl">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-muted-foreground">
                  Sign up and create your personalized profile with your name, bio, and profile picture.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Add Your Links</h3>
                <p className="text-muted-foreground">
                  Add all your important links - GitHub, LinkedIn, portfolio, blog, and more.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Share Your Profile</h3>
                <p className="text-muted-foreground">
                  Share your unique profile URL (e.g., links.example.com/@yourname) with colleagues and clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground">
            Join your colleagues and create your professional link hub today.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Your Profile
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage