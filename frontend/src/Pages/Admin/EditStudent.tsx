import React from 'react';
import StudentForm from '../../components/common/StudentForm';

const EditStudent: React.FC = () => {
  return (
    <div className="pb-12">
      <StudentForm layout="admin" mode="edit" />
    </div>
  );
};

export default EditStudent;
