import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Minimal layout without header/footer for public profiles
const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default PublicLayout
