import React from 'react';
import Helmet from 'react-helmet';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import Icon from '@/Shared/Icon';
import SearchFilter from '@/Shared/SearchFilter';
import Pagination from '@/Shared/Pagination';

const MapLocations = () => {
  const { maplocations } = usePage();
  
  const { links, data } = maplocations;
  return (
    <div>
      <Helmet title="MapLocations" />
      <div>
        <h1 className="mb-8 font-bold text-3xl">Map Locations</h1>
        <div className="mb-6 flex justify-between items-center">
          <SearchFilter />
          <InertiaLink
            className="btn-red"
            href={route('maplocations.create')}
          >
            <span>Create</span>
            <span className="hidden md:inline"> Map Location</span>
          </InertiaLink>
        </div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full whitespace-no-wrap">
            <thead>
              <tr className="text-left font-bold">
                <th className="px-6 pt-5 pb-4">Name</th>
                <th className="px-6 pt-5 pb-4" colSpan="2">Campaign</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ id, name, campaign }) => {
                return (
                  <tr
                    key={id}
                    className="hover:bg-gray-100 focus-within:bg-gray-100"
                  >
                    <td className="border-t">
                      <InertiaLink
                        href={route('maplocations.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {name}
                      </InertiaLink>
                    </td>
                    <td className="border-t">
                      <InertiaLink
                        href={route('maplocations.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {campaign && campaign.name}
                      </InertiaLink>
                    </td>
                    <td className="border-t w-px">
                      <InertiaLink
                        tabIndex="-1"
                        href={route('maplocations.edit', id)}
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
                    No map locations found.
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
MapLocations.layout = page => <Layout children={page} />;

export default MapLocations;