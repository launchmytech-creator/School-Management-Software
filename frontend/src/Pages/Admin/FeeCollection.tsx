import FeeCollectionPage from '../../components/fee/FeeCollectionPage';

const FeeCollection: React.FC = () => (
  <FeeCollectionPage layout="admin" canApplyWaiver={true} canEdit={true} />
);

export default FeeCollection;
