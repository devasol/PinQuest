import React from 'react';
import DiscoverMain from '../../components/Discover/DiscoverMain';
import usePageTitle from '../../services/usePageTitle';

const DiscoverPage = () => {
  usePageTitle("Discover");

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <DiscoverMain />
    </div>
  );
};

export default DiscoverPage;