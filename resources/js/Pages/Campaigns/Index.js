import React from 'react';
import Helmet from 'react-helmet';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import Icon from '@/Shared/Icon';
import SearchFilter from '@/Shared/SearchFilter';
import Pagination from '@/Shared/Pagination';

const Campaigns = () => {
  const { campaigns } = usePage();
  const { links, data } = campaigns;
  return (
    <div>
      <Helmet title="Campaigns" />
      <div>
        <h1 className="mb-8 font-bold text-3xl">Campaigns</h1>
        <div className="mb-6 flex justify-between items-center">
          <SearchFilter />
          <InertiaLink
            className="btn-red"
            href={route('campaigns.create')}
          >
            <span>Create</span>
            <span className="hidden md:inline"> Campaign</span>
          </InertiaLink>
        </div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full whitespace-no-wrap">
            <thead>
              <tr className="text-left font-bold">
                <th className="px-6 pt-5 pb-4">Name</th>
                <th className="px-6 pt-5 pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ id, name }) => {
                return (
                  <tr
                    key={id}
                    className="hover:bg-gray-100 focus-within:bg-gray-100"
                  >
                    <td className="border-t">
                      <InertiaLink
                        href={route('campaigns.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {name}
                      </InertiaLink>
                    </td>
                    <td className="border-t w-px">
                      <InertiaLink
                        tabIndex="-1"
                        href={route('campaigns.edit', id)}
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
              })}
              {data.length === 0 && (
                <tr>
                  <td className="border-t px-6 py-4" colSpan="4">
                    No campaigns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination links={links} />
      </div>
    </div>
  );
};

// Persisten layout
// Docs: https://inertiajs.com/pages#persistent-layouts
Campaigns.layout = page => <Layout children={page} />;

export default Campaigns;