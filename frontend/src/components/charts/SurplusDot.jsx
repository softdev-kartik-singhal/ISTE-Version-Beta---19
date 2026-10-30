// Point on the net-surplus line: red for a deficit month, larger for the peak month.

export default function SurplusDot({ cx, cy, payload, index }) {
  const deficit = payload.surplus < 0;
  return (
    <circle key={index} cx={cx} cy={cy} r={payload.peak ? 6 : 5} fill={deficit ? '#ba1a1a' : payload.peak ? '#1d4ed8' : '#0037b0'} stroke="#ffffff" strokeWidth={payload.peak ? 2.5 : 2} />
  );
}
