import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import LoadingButton from '@/Shared/LoadingButton';
import TextInput from '@/Shared/TextInput';
import TextArea from '@/Shared/TextArea';
import SelectInput from '@/Shared/SelectInput';

export default () => {
  const { errors, campaigns, locations } = usePage();
  const [sending, setSending] = useState(false);
  
  const [values, setValues] = useState({
	title: '',
	content: '',
	location_id: 0,
	start_offset: 0,
	campaign_id: campaigns[0].id || '',
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
    Inertia.post(route('timelineevents.store'), values).then(() => {
      setSending(false);
    });
  }

  return (
    <Layout>
      <Helmet title="Create Timeline Event" />
      <div>
        <h1 className="mb-8 font-bold text-3xl">
          <InertiaLink
            href={route('timelineevents')}
            className="text-red-600 hover:text-red-700"
          >
            Timeline Events
          </InertiaLink>
          <span className="text-red-600 font-medium"> /</span> Create
        </h1>
        <div className="bg-white rounded shadow overflow-hidden max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 -mr-6 -mb-8 flex flex-wrap">
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Title"
                name="title"
                errors={errors.title}
                value={values.title}
                onChange={handleChange}
              />
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Date"
                name="start_offset"
                errors={errors.start_offset}
                value={values.start_offset}
                onChange={handleChange}
              />
              <TextArea
                className="pr-6 pb-8 w-full"
                label="Content"
				name="content"
				rows="7"
                errors={errors.content}
                value={values.content}
                onChange={handleChange}
              />
              <SelectInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Location"
                name="location_id"
                errors={errors.location_id}
                value={values.location_id}
                onChange={handleChange}
              >
				  
				{locations.map(({ id, name }) => {
					return(
						<option key={id} value={id}>{name}</option>
					);
				})}
              </SelectInput>
              <SelectInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Campaign"
                name="campaign_id"
                errors={errors.campaign_id}
                value={values.campaign_id}
                onChange={handleChange}
              >
				  
				{campaigns.map(({ id, name }) => {
					return(
						<option key={id} value={id}>{name}</option>
					);
				})}
              </SelectInput>
            </div>
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center">
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red"
              >
                Create Timeline Event
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};