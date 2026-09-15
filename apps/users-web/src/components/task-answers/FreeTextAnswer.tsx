type Props = {
  value: string;
  onChange:
    (value: string) => void;
};

export default function FreeTextAnswer({
  value,
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
        rows={5}
        placeholder="Skriv dit svar..."
      />
    </label>
  );
}