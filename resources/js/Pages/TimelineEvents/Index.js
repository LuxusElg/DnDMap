import React from 'react';
import Helmet from 'react-helmet';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';
import Icon from '@/Shared/Icon';
import SearchFilter from '@/Shared/SearchFilter';
import Pagination from '@/Shared/Pagination';

const TimelineEvents = () => {
  const { timelineevents } = usePage();
  
  const { links, data } = timelineevents;
  console.log(timelineevents, links, data);
  return (
    <div>
      <Helmet title="TimelineEvents" />
      <div>
        <h1 className="mb-8 font-bold text-3xl">Timeline Events</h1>
        <div className="mb-6 flex justify-between items-center">
          <SearchFilter />
          <InertiaLink
            className="btn-red"
            href={route('timelineevents.create')}
          >
            <span>Create</span>
            <span className="hidden md:inline"> Timeline Event</span>
          </InertiaLink>
        </div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full whitespace-no-wrap">
            <thead>
              <tr className="text-left font-bold">
                <th className="px-6 pt-5 pb-4">Title</th>
                <th className="px-6 pt-5 pb-4">Location</th>
                <th className="px-6 pt-5 pb-4">Date</th>
                <th className="px-6 pt-5 pb-4" colSpan="2">Campaign</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ id, title, location, start_offset, campaign }) => {
                return (
                  <tr
                    key={id}
                    className="hover:bg-gray-100 focus-within:bg-gray-100"
                  >
                    <td className="border-t">
                      <InertiaLink
                        href={route('timelineevents.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {title}
                      </InertiaLink>
                    </td>
                    <td className="border-t">
                      <InertiaLink
                        href={route('timelineevents.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {location && location.name}
						{!location && 'Wilderness'}
                      </InertiaLink>
                    </td>
                    <td className="border-t">
                      <InertiaLink
                        href={route('timelineevents.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {start_offset}
                      </InertiaLink>
                    </td>
                    <td className="border-t">
                      <InertiaLink
                        href={route('timelineevents.edit', id)}
                        className="px-6 py-4 flex items-center focus:text-red-700"
                      >
                        {campaign && campaign.name}
                      </InertiaLink>
                    </td>
                    <td className="border-t w-px">
                      <InertiaLink
                        tabIndex="-1"
                        href={route('timelineevents.edit', id)}
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
                    No timeline events found.
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
TimelineEvents.layout = page => <Layout children={page} />;

export default TimelineEvents;