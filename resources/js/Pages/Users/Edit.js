import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import DeleteButton from '@/Shared/DeleteButton';
import LoadingButton from '@/Shared/LoadingButton';
import TextInput from '@/Shared/TextInput';
import SelectInput from '@/Shared/SelectInput';

export default () => {
  const { user, errors } = usePage();
  const [sending, setSending] = useState(false);
  const [values, setValues] = useState({
    username: user.username || '',
    email: user.email || '',
    password: user.password || '',
    role: user.role || 'user'
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
	
    const formData = values;

    Inertia.put(route('users.update', user.id), formData).then(() => {
      setSending(false);
    });
  }

  function destroy() {
    if (confirm('Are you sure you want to delete this user?')) {
      Inertia.delete(route('users.destroy', user.id));
    }
  }

  function restore() {
    if (confirm('Are you sure you want to restore this user?')) {
      Inertia.put(route('users.restore', user.id));
    }
  }

  return (
    <Layout>
      <div>
        <Helmet title={`${values.username}`} />
        <div className="mb-8 flex justify-start max-w-lg">
          <h1 className="font-bold text-3xl">
            <InertiaLink
              href={route('users')}
              className="text-red-600 hover:text-red-700"
            >
              Users
            </InertiaLink>
            <span className="text-red-600 font-medium mx-2">/</span>
            {values.username}
          </h1>
        </div>
        <div className="bg-white rounded shadow overflow-hidden max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 -mr-6 -mb-8 flex flex-wrap">
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="First Name"
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
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex items-center">
              {!user.deleted_at && (
                <DeleteButton onDelete={destroy}>Delete User</DeleteButton>
              )}
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red ml-auto"
              >
                Update User
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};