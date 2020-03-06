import { Inertia } from '@inertiajs/inertia'
import React from 'react'
import Layout from './Layout'

export default function Register({ user }) {
  return (
    <Layout title="Register">
      <h1>Welcome</h1>
	  <RegisterForm />
    </Layout>
  )
}

class RegisterForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',
			email: '',
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
  
	handleChange(e) {
		const target = event.target;
		const value = target.value;
		const name = target.name;

		this.setState({
			[name]: value
		});
	}
  
	handleSubmit(e) {
	  e.preventDefault();
	  Inertia.post(route('register'), this.state);
	}
  
	render() {
		return (
		  <form onSubmit={this.handleSubmit}>
			<input name="username" value={this.state.username} onChange={this.handleChange} />
			<input name="email" type="email" value={this.state.email} onChange={this.handleChange} />
			<input name="password" type="password" value={this.state.password} onChange={this.handleChange} />
			<button type="submit">Submit</button>
		  </form>
		);
	}
}