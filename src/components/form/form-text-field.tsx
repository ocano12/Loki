import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type TextFieldProps } from '@/components/form/text-field';

type FormTextFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/** TextField wired to react-hook-form; shows the field's Zod validation message. */
export function FormTextField<T extends FieldValues>({ control, name, ...rest }: FormTextFieldProps<T>) {
  // Destructured so the React Compiler doesn't treat the whole `field` object as a ref.
  const {
    field: { ref, value, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <TextField
      ref={ref}
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      error={error?.message}
      {...rest}
    />
  );
}
