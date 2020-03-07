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
    name: '',
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
    Inertia.post(route('campaigns.store'), values).then(() => {
      setSending(false);
    });
  }

  return (
    <Layout>
      <Helmet title="Create Campaign" />
      <div>
        <h1 className="mb-8 font-bold text-3xl">
          <InertiaLink
            href={route('campaigns')}
            className="text-red-600 hover:text-red-700"
          >
            Campaigns
          </InertiaLink>
          <span className="text-red-600 font-medium"> /</span> Create
        </h1>
        <div className="bg-white rounded shadow overflow-hidden max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 -mr-6 -mb-8 flex flex-wrap">
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Name"
                name="name"
                errors={errors.name}
                value={values.name}
                onChange={handleChange}
              />
            </div>
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center">
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red"
              >
                Create Campaign
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};