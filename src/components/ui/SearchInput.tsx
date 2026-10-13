import { Input, type InputProps } from './Input';

export type SearchInputProps = Omit<
  InputProps,
  'leadingIcon' | 'clearable' | 'secure' | 'value' | 'onChangeText'
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Search field: the `Input` shell plus search icon, clear button and
 * keyboard flags. Purely presentational - filtering happens wherever the
 * value is owned (usually debounced in a feature hook).
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder = 'Search',
  ...rest
}: SearchInputProps) {
  return (
    <Input
      {...rest}
      leadingIcon="search"
      clearable
      value={value}
      onChangeText={onValueChange}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
  );
}
