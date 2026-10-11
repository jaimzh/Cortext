const segmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
function characters(value) {
  return segmenter ? [...segmenter.segment(value)].map((item) => item.segment) : Array.from(value);
}

export function keyboardEdit(previous, next) {
  const before = characters(previous);
  const after = characters(next);
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix])
    prefix++;
  return { delete: before.length - prefix, text: after.slice(prefix).join('') };
}
