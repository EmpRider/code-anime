import { format, Processor } from './helpers.js';
export function generate(value: number, approved: boolean, amounts: number[]) {
  let result = 0;
  if (approved) {
    const service = new Processor();
    result = service.generate(value);
  } else {
    result = 9;
  }
  for (const amount of amounts) {
    result = format(amount);
  }
  return result;
}
export function recursive(value: number) {
  return recursive(value);
}
export function external() {
  return fetch('https://example.invalid');
}
export function counted() {
  let result = 0;
  for (let i = 0; i < 2; i++) {
    result = format(i);
  }
  return result;
}
export function logical() {
  return false && external();
}
export function update(input: { amount: number }) {
  input.amount = 4;
  return input.amount;
}
