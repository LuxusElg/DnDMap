import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Inertia } from '@inertiajs/inertia';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import DeleteButton from '@/Shared/DeleteButton';
import LoadingButton from '@/Shared/LoadingButton';
import TextInput from '@/Shared/TextInput';
import SearchFilter from '@/Shared/SearchFilter';
import Icon from '@/Shared/Icon';
import Pagination from '@/Shared/Pagination';

export default () => {
  const { errors, campaign, users } = usePage();
  const [sending, setSending] = useState(false);
  const { links, data } = users;

  const [values, setValues] = useState({
	name: campaign.name || '',
	start: campaign.start || 0,
  });

  console.log(campaign, links, data);

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
      route('campaigns.update', campaign.id),
      values
    ).then(() => setSending(false));
  }

  function destroy() {
    if (confirm('Are you sure you want to delete this campaign?')) {
      Inertia.delete(route('campaigns.destroy', campaign.id));
    }
  }

  function restore() {
    if (confirm('Are you sure you want to restore this campaign?')) {
      Inertia.put(route('campaigns.restore', campaign.id));
    }
  }

  return (
    <Layout>
      <Helmet title={values.name} />
      <div>
        <h1 className="mb-8 font-bold text-3xl">
          <InertiaLink
            href={route('campaigns')}
            className="text-red-600 hover:text-red-700"
          >
            Campaigns
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
                label="In-universe start date"
                name="start"
                errors={errors.start}
                value={values.start}
                onChange={handleChange}
              />
            </div>
            <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 flex items-center">
              {!campaign.deleted_at && (
                <DeleteButton onDelete={destroy}>
                  Delete campaign
                </DeleteButton>
              )}
              <LoadingButton
                loading={sending}
                type="submit"
                className="btn-red ml-auto"
              >
                Update Campaign
              </LoadingButton>
            </div>
          </form>
        </div>
        <h2 className="mt-12 font-bold text-2xl">Players</h2>
        <div className="mt-6 bg-white rounded shadow overflow-x-auto">
          <table className="w-full whitespace-no-wrap">
            <thead>
              <tr className="text-left font-bold">
                <th className="px-6 pt-5 pb-4">Username</th>
                <th className="px-6 pt-5 pb-4" colSpan="4">Character</th>
              </tr>
            </thead>
            <tbody>
              {campaign.players.map(
                ({ id, username }) => {
                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-100 focus-within:bg-gray-100"
                    >
                      <td className="border-t">
                        <InertiaLink
                          href={route('users.edit', id)}
                          className="px-6 py-4 flex items-center focus:text-red"
                        >
                          {username}
                        </InertiaLink>
                      </td>
                      <td className="border-t">
                        <InertiaLink
                          href={route('users.edit', id)}
                          className="px-6 py-4 flex items-center focus:text-red"
                        >
                          -
                        </InertiaLink>
                      </td>
                      <td className="border-t">
						  {(!campaign.dm || campaign.dm.id !== id) &&
							<SetDMButton   
							campaign={campaign}
							user={id}
							/>}
							{(campaign.dm && campaign.dm.id === id) &&
							"DM"}
                      </td>
                      <td className="border-t">
						  	<RemoveUserButton 
								campaign={campaign}
								user={id}
							/>
                      </td>
                      <td className="border-t w-px">
                        <InertiaLink
                          tabIndex="-1"
                          href={route('users.edit', id)}
                          className="px-4 flex items-center"
                        >
                          <Icon
                            name="cheveron-right"
                            className="block w-6 h-6 text-gray-400 fill-current"
                          />
                        </InertiaLink>
                      </td>
                    </tr>
                  );
                }
              )}
              {campaign.players.length === 0 && (
                <tr>
                  <td className="border-t px-6 py-4" colSpan="4">
                    No players found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
		</div>
		<h2 className="mt-12 font-bold text-2xl">Add Players</h2>
        <div className="mt-6 bg-white rounded shadow overflow-x-auto">
          	<SearchFilter 
		  		campaign={campaign.id}
			/>
		  
		  <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full whitespace-no-wrap">
            <thead>
              <tr className="text-left font-bold">
                <th className="px-6 pt-5 pb-4" colSpan="2">Name</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ id, username, email, role }) => {
                return (
                  <tr
                    key={id}
                    className="hover:bg-gray-100 focus-within:bg-gray-100"
                  >
                    <td className="border-t">
                      <InertiaLink
                        href={route('users.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {username}
                      </InertiaLink>
                    </td>
                    <td className="border-t w-px">
						<AddUserButton 
							campaign={campaign}
							user={id}
						/>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td className="border-t px-6 py-4" colSpan="4">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination links={links} />
        </div>
      </div>
    </Layout>
  );
};

function AddUserButton(props) {
	
	const [sending, setSending] = useState(false);
	function handleClick(event) {
		event.preventDefault();
		setSending(true);
		Inertia.post(route('campaigns.adduser', props.campaign.id), {
			user_id: props.user
		});
	}
	return (
		<LoadingButton
			loading={sending}
			onClick={handleClick}
			className="btn-red ml-auto"
		>
		Add User to Campaign
	  </LoadingButton>
	);
}

function SetDMButton(props) {
	
	const [sending, setSending] = useState(false);
	function handleClick(event) {
		event.preventDefault();
		setSending(true);
		Inertia.post(route('campaigns.setdm', props.campaign.id), {
			user_id: props.user
		});
	}
	return (
		<LoadingButton
			loading={sending}
			onClick={handleClick}
			className="btn-red ml-auto"
		>
		Set DM
	  </LoadingButton>
	);
}

function RemoveUserButton(props) {
	
	const [sending, setSending] = useState(false);
	function handleClick(event) {
		event.preventDefault();
		setSending(true);
		Inertia.post(route('campaigns.removeuser', props.campaign.id), {
			user_id: props.user
		});
	}
	return (
		<LoadingButton
			loading={sending}
			onClick={handleClick}
			className="btn-red ml-auto"
		>
		Remove User
	  </LoadingButton>
	);
}