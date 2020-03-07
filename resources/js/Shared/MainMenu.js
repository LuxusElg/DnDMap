import React from 'react';
import MainMenuItem from '@/Shared/MainMenuItem';

export default ({ className }) => {
  return (
    <div className={className}>
      <MainMenuItem text="Dashboard" link="home" icon="dashboard" />
      <MainMenuItem text="Organizations" link="home" icon="office" />
      <MainMenuItem text="Contacts" link="home" icon="users" />
      <MainMenuItem text="Reports" link="home" icon="printer" />
    </div>
  );
};