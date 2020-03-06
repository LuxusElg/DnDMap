import React from 'react'
import Layout from './Layout'

export default class Login extends React.Component {

	render() {

		return (
		  <Layout title="Welcome">
			  <form>
				  <input name="email" />
				  <input type="password" name="password" />
			  </form>
		  </Layout>
		);
	}
}