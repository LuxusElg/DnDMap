import React from 'react';
import Helmet from 'react-helmet';
import { InertiaLink, usePage } from '@inertiajs/inertia-react';
import Layout from '@/Shared/Layout';

const Dashboard = () => {
	const { campaigns } = usePage();
	return (
		<div>
			<Helmet>
				<title>Map Overview</title>
			</Helmet>
			<h1 className="mb-8 font-bold text-3xl">Map Overview</h1>
			{campaigns.map(({ id, name }) => {
				return (
					<InertiaLink
						key={id}
						href={route('map', id)}
					>
						{name}
					</InertiaLink>
				);
			})}
		</div>
	);
};

// Persisten layout
// Docs: https://inertiajs.com/pages#persistent-layouts
Dashboard.layout = page => <Layout children={page} />;

export default Dashboard;