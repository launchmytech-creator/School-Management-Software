import React from 'react';
import StudentForm from '../../components/common/StudentForm';

const AddStudent: React.FC = () => {
  return <StudentForm layout="admin" mode="create" />;
};

export default AddStudent;
