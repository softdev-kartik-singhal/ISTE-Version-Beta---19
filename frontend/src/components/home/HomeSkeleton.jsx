// Placeholder blocks shaped like the Home page while its data loads.

const Block = ({ className }) => <div className={`rounded-2xl bg-slate-200/70 animate-pulse motion-reduce:animate-none ${className}`} />;

export default function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Home" role="status">
      <Block className="h-[300px] rounded-[20px]" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Block key={i} className="h-[170px]" />)}</div>
      <Block className="h-[200px]" />
      <div className="grid lg:grid-cols-2 gap-4"><Block className="h-[300px]" /><Block className="h-[300px]" /></div>
    </div>
  );
}
