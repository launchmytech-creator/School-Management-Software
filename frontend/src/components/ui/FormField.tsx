import React from 'react';
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import InputField from './InputField';

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref' | 'name'> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  icon?: string;
  onToggleEye?: () => void;
  inputClassName?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  registration,
  error,
  icon,
  onToggleEye,
  inputClassName,
  ...props
}) => {
  return (
    <InputField
      label={label}
      icon={icon}
      onToggleEye={onToggleEye}
      inputClassName={inputClassName}
      error={error?.message}
      {...registration}
      {...props}
    />
  );
};

export default FormField;
