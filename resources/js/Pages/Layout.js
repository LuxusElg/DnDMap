import React, { useEffect } from 'react'
import { InertiaLink } from '@inertiajs/inertia-react'

export default function Layout({ title, children }) {
  useEffect(() => {
    document.title = title;
  }, [title])

  return (
    <main>
      <header>
        <InertiaLink href="/">Home</InertiaLink>
		<InertiaLink href={route('logout')}>Logout</InertiaLink>
      </header>

      <article>{children}</article>
    </main>
  )
}