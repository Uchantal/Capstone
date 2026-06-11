interface Props {
  value: string | number
  label: string
}

export default function ProgressStat({ value, label }: Props) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <p className="text-text-primary font-bold text-3xl leading-tight">{value}</p>
      <p className="text-text-secondary text-sm mt-1">{label}</p>
    </div>
  )
}
