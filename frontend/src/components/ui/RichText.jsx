// Renders a sentence stored as data: plain strings, plus {text, className} pieces for highlighted words.

export default function RichText({ parts }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? part : <span key={i} className={part.className}>{part.text}</span>,
      )}
    </>
  );
}
