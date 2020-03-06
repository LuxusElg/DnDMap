import React from 'react'
import Layout from './Layout'
import { InertiaLink, usePage } from '@inertiajs/inertia-react'

export default function Welcome() {
	const { user } = usePage();
	console.log(user);
  return (
    <Layout title="Welcome">
      <h1>Welcome</h1>
      <p>Hello , welcome to your first Inertia app!</p>
    </Layout>
  )
}