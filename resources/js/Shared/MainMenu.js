import React from 'react';
import MainMenuItem from '@/Shared/MainMenuItem';

export default ({ className }) => {
	return (
		<div className={className}>
			<MainMenuItem text="Map Overview" link="home" icon="dashboard" />
			<MainMenuItem text="Campaigns" link="campaigns" icon="dashboard" />
			<MainMenuItem text="Timeline Events" link="timelineevents" icon="dashboard" />
			<MainMenuItem text="Users" link="users" icon="office" />
			<MainMenuItem text="Map Locations" link="maplocations" icon="users" />
		</div>
	);
};