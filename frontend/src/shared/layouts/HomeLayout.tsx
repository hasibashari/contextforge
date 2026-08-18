import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface HomeLayoutProps {
  children: React.ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-primary/15 selection:text-primary relative flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
