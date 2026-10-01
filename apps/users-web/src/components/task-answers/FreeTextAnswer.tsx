type Props = {
  value: string;
  disabled: boolean;
  onChange:
    (value: string) => void;
};

export default function FreeTextAnswer({
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <label>
      <span>Dit svar</span>
      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        disabled={disabled}
        rows={5}
        placeholder="Skriv dit svar..."
      />
    </label>
  );
}