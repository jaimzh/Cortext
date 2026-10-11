import { expect, it } from 'vitest';
import { keyboardEdit } from './liveKeyboardInput.js';

it('preserves whitespace and replaces edited suffixes', () => {
  expect(keyboardEdit('cat', 'cats ')).toEqual({ delete: 0, text: 's ' });
  expect(keyboardEdit('teh', 'the')).toEqual({ delete: 2, text: 'he' });
  expect(keyboardEdit('hi ', 'hi\n')).toEqual({ delete: 1, text: '\n' });
  expect(keyboardEdit('hello', '')).toEqual({ delete: 5, text: '' });
});

it('does not split emoji or composed characters when deleting', () => {
  expect(keyboardEdit('a👨‍👩‍👧', 'a')).toEqual({ delete: 1, text: '' });
  expect(keyboardEdit('ae\u0301', 'a')).toEqual({ delete: 1, text: '' });
});
