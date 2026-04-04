import FeeCollectionPage from '../../components/fee/FeeCollectionPage';

const AccountantFeeCollection: React.FC = () => (
  <FeeCollectionPage layout="accountant" canApplyWaiver={false} canEdit={false} />
);

export default AccountantFeeCollection;
