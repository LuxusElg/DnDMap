import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import DeleteButton from '@/Shared/DeleteButton';
import LoadingButton from '@/Shared/LoadingButton';
import TextInput from '@/Shared/TextInput';
import SelectInput from '@/Shared/SelectInput';
import Icon from '@/Shared/Icon';
import Pagination from '@/Shared/Pagination';

export default () => {
  const { errors, maplocation, campaigns } = usePage();
  const [sending, setSending] = useState(false);
  console.log(maplocation);

  const [values, setValues] = useState({
	name: maplocation.name || '',
	pin_x: maplocation.pin_x || 0,
	pin_y: maplocation.pin_y || 0,
	size: maplocation.size || 0,
	campaign_id: maplocation.campaign_id || campaigns[0].id || '',
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
    Inertia.put(
      route('maplocations.update', maplocation.id),
      values
    ).then(() => setSending(false));
  }

  function destroy() {
    if (confirm('Are you sure you want to delete this map location?')) {
      Inertia.delete(route('maplocations.destroy', maplocation.id));
    }
  }

  function restore() {
    if (confirm('Are you sure you want to restore this map location?')) {
      Inertia.put(route('maplocations.restore', maplocation.id));
    }
  }

  return (
    <Layout>
      <Helmet title={values.name} />
      <div>
        <h1 className="mb-8 font-bold text-3xl">
          <InertiaLink
            href={route('maplocations')}
            className="text-red-600 hover:text-red-700"
          >
            Map Locations
          </InertiaLink>
          <span className="text-red-600 font-medium mx-2">/</span>
          {values.name}
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
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Size"
                name="size"
                errors={errors.size}
                value={values.size}
                onChange={handleChange}
              />
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="X Position"
                name="pin_x"
                errors={errors.pin_x}
                value={values.pin_x}
                onChange={handleChange}
              />
              <TextInput
                className="pr-6 pb-8 w-full lg:w-1/2"
                label="Y Position"
                name="pin_y"
                errors={errors.pin_y}
                value={values.pin_y}
                onChange={handleChange}
              />
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
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex items-center">
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red ml-auto"
              >
                Update Map Location
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
