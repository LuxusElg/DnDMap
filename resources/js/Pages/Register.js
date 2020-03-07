import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Logo from '@/Shared/Logo';
import LoadingButton from '@/Shared/LoadingButton';
import FlashMessages from '@/Shared/FlashMessages';
import TextInput from '@/Shared/TextInput';

export default () => {
	const { errors } = usePage();
	const [sending, setSending] = useState(false);

	const [values, setValues] = useState({
		username: '',
		email: '',
		password: '',
	});

	function handleChange(e) {
		const key = e.target.name;
		const value = e.target.value;
		setValues(values => ({
			...values,
			[key]: value
		}));
	}

	function handleSubmit(e) {
		e.preventDefault();
		setSending(true);

		Inertia.post(route('register'), values).then(() => {
			setSending(false);
		});
	}

	return (
		<div className="p-6 bg-gray-900 min-h-screen flex justify-center items-center">
			<Helmet title="Login" />
			<div className="w-full max-w-md">
				<Logo
					className="block mx-auto w-full max-w-xs text-white fill-current"
					height={150}
				/>
				<form
					onSubmit={handleSubmit}
					className="mt-8 bg-white rounded-lg shadow-xl overflow-hidden"
				>
					<div className="px-10 py-12">
						<h1 className="text-center font-bold text-3xl">Welcome!</h1>
              			<FlashMessages />
						<div className="mx-auto mt-6 w-24 border-b-2" />
						<TextInput
							className="mt-5"
							label="Username"
							name="username"
							errors={errors.username}
							value={values.username}
							onChange={handleChange}
						/>
						<TextInput
							className="mt-5"
							label="Email"
							name="email"
							type="email"
							errors={errors.email}
							value={values.email}
							onChange={handleChange}
						/>
						<TextInput
							className="mt-5"
							label="Password"
							name="password"
							type="password"
							errors={errors.password}
							value={values.password}
							onChange={handleChange}
						/>
						<TextInput
							className="mt-5"
							label="Confirm password"
							name="password_confirmation"
							type="password"
							errors={errors.password_confirm}
							value={values.password_confirm}
							onChange={handleChange}
						/>
					</div>
					<div className="px-10 py-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
						<LoadingButton
							type="submit"
							loading={sending}
							className="btn-red"
						>
							Register
						</LoadingButton>
					</div>
				</form>
			</div>
		</div>
	);
};