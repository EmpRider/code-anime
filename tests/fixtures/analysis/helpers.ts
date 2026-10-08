export function format(value: number) {
  const row = { amount: value };
  row.amount = value + 2;
  return row.amount;
}
export class Processor {
  generate(value: number) {
    return format(value);
  }
}
