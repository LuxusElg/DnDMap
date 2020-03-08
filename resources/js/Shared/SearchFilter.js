import React, { useState, useEffect, useRef } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/inertia-react';
import { usePrevious } from 'react-use';
import SelectInput from '@/Shared/SelectInput';
import pickBy from 'lodash/pickBy';

export default (props) => {
  const { filters } = usePage();
  const [opened, setOpened] = useState(false);

  const [values, setValues] = useState({
    role: filters.role || '', // role is used only on users page
    search: filters.search || '',
	trashed: filters.trashed || '',
	...props
  });

  const prevValues = usePrevious(values);

  function reset() {
    setValues({
      role: '',
      search: '',
	  trashed: '',
	  ...props
    });
  }

  useEffect(() => {
    // https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
    if (prevValues) {
      const query = Object.keys(pickBy(values)).length
        ? pickBy(values)
        : { remember: 'forget' };
      Inertia.replace(route(route().current(), query));
    }
  }, [values]);

  function handleChange(e) {
    const key = e.target.name;
    const value = e.target.value;

    setValues(values => ({
      ...values,
      [key]: value
    }));

    if (opened) setOpened(false);
  }

  return (
    <div className="flex items-center w-full max-w-md mr-4">
      <div className="relative flex w-full bg-white shadow rounded">
        <div
          style={{ top: '100%' }}
          className={`absolute ${opened ? '' : 'hidden'}`}
        >
          <div
            onClick={() => setOpened(false)}
            className="bg-black opacity-25 fixed inset-0 z-20"
          ></div>
          <div className="relative w-64 mt-2 px-4 py-6 shadow-lg bg-white rounded z-30">
            {filters.hasOwnProperty('role') && (
              <SelectInput
                className="mb-4"
                label="Role"
                name="role"
                value={values.role}
                onChange={handleChange}
              >
                <option value=""></option>
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </SelectInput>
            )}
            <SelectInput
              label="Trashed"
              name="trashed"
              value={values.trashed}
              onChange={handleChange}
            >
              <option value=""></option>
              <option value="with">With Trashed</option>
              <option value="only">Only Trashed</option>
            </SelectInput>
          </div>
        </div>
        <button
          onClick={() => setOpened(true)}
          className="px-4 md:px-6 rounded-l border-r hover:bg-gray-100 focus:outline-none focus:border-white focus:shadow-outline focus:z-10"
        >
          <div className="flex items-baseline">
            <span className="text-gray-700 hidden md:inline">Filter</span>
            <svg
              className="w-2 h-2 fill-current text-gray-700 md:ml-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 961.243 599.998"
            >
              <path d="M239.998 239.999L0 0h961.243L721.246 240c-131.999 132-240.28 240-240.624 239.999-.345-.001-108.625-108.001-240.624-240z" />
            </svg>
          </div>
        </button>
        <input
          className="relative w-full px-6 py-3 rounded-r focus:shadow-outline"
          autoComplete="off"
          type="text"
          name="search"
          name="search"
          value={values.search}
          onChange={handleChange}
          placeholder="Search…"
        />
      </div>
      <button
        onClick={reset}
        className="ml-3 text-sm text-gray-600 hover:text-gray-700 focus:text-red-700 focus:outline-none"
        type="button"
      >
        Reset
      </button>
    </div>
  );
};