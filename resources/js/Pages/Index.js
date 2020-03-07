import React from 'react';
import Helmet from 'react-helmet';
import { InertiaLink } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';

const Dashboard = () => {
  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <h1 className="mb-8 font-bold text-3xl">Dashboard</h1>
      <p className="mb-12 leading-normal">
        Hey there! Check out the map :)
      </p>
    </div>
  );
};

// Persisten layout
// Docs: https://inertiajs.com/pages#persistent-layouts
Dashboard.layout = page => <Layout children={page} />;

export default Dashboard;