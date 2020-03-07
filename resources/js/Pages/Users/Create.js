import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import LoadingButton from '@/Shared/LoadingButton';
import TextInput from '@/Shared/TextInput';
import SelectInput from '@/Shared/SelectInput';

export default () => {
  const { errors } = usePage();
  const [sending, setSending] = useState(false);

  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  function handleChange(e) {
    const key = e.target.name;
	const value = e.target.value;
	console.log(key, value);
    setValues(values => ({
      ...values,
      [key]: value
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);

    const formData = values;

    Inertia.post(route('users.store'), formData).then(() => {
      setSending(false);
    });
  }

  return (
    <Layout>
      <div>
        <Helmet title="Create User" />
        <div>
          <h1 className="mb-8 font-bold text-3xl">
            <InertiaLink
              href={route('users')}
              className="text-red-600 hover:text-red-700"
            >
              Users
            </InertiaLink>
            <span className="text-red-600 font-medium"> /</span> Create
          </h1>
        </div>
        <div className="bg-white rounded shadow overflow-hidden max-w-3xl">
          <form name="createForm" onSubmit={handleSubmit}>
            <div className="p-8 -mr-6 -mb-8 flex flex-wrap">
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Username"
                name="username"
                errors={errors.username}
                value={values.username}
                onChange={handleChange}
              />
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Email"
                name="email"
                type="email"
                errors={errors.email}
                value={values.email}
                onChange={handleChange}
              />
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Password"
                name="password"
                type="password"
                errors={errors.password}
                value={values.password}
                onChange={handleChange}
              />
              <SelectInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Role"
                name="role"
                errors={errors.role}
                value={values.role}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </SelectInput>
            </div>
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center">
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red"
              >
                Create User
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};