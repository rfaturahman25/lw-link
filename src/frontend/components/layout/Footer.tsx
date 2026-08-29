import React from 'react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background py-6">
      <div className="container mx-auto px-4 flex justify-center items-center text-sm text-muted-foreground">
        <span>© {currentYear} LW-link — internal</span>
      </div>
    </footer>
  )
}

export default Footer
