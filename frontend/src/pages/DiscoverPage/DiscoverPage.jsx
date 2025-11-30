import React from 'react';
import DiscoverMain from '../../components/Discover/DiscoverMain';
import usePageTitle from '../../services/usePageTitle';

const DiscoverPage = () => {
  usePageTitle("Discover");

  return (
    <DiscoverMain />
  );
};

export default DiscoverPage;