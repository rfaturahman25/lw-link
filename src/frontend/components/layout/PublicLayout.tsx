import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Minimal layout without header/footer for public profiles
// Background is controlled by the page itself (e.g. PublicProfilePage theme)
// so this layout stays transparent and doesn't impose bg-gray-50.
const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default PublicLayout
