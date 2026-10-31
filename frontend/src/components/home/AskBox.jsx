// "Can I afford…?" input on Home; the question is answered on the Ask tab (an empty box asks the example question).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function AskBox({ example }) {
  const [question, setQuestion] = useState('');
  const navigate = useNavigate();

  function ask(e) {
    e.preventDefault();
    navigate('/ask', { state: { question: question.trim() || example } });
  }

  return (
    <form onSubmit={ask} className="flex flex-col sm:flex-row gap-space-sm bg-surface-container-lowest rounded-xl p-space-sm shadow-sm border border-[#E3E8EF]">
      <label className="relative flex-1 flex items-center">
        <span className="sr-only">Can I afford…?</span>
        <Sparkles size={20} className="absolute left-3.5 text-primary" />
        <input
          className="w-full h-12 pl-11 pr-4 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
          placeholder="Can I afford…?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      <button type="submit" className="h-12 px-space-lg rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2">
        Ask <ArrowRight size={18} />
      </button>
    </form>
  );
}
