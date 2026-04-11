import React, { forwardRef } from "react";
import Input from "./input/InputField";
import Label from "./Label";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, ...rest }, ref) => {
    return (
      <div>
        {label && <Label>{label}</Label>}
        <Input
          ref={ref}
          error={!!error}
          hint={error}
          {...rest}
        />
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
