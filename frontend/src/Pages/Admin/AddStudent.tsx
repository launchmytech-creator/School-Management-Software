import React from 'react';
import StudentForm from '../../components/common/StudentForm';

const AddStudent: React.FC = () => {
  return (
    <div className="pb-12">
      <StudentForm layout="admin" mode="create" />
    </div>
  );
};

export default AddStudent;
