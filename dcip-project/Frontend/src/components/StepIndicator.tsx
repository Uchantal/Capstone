interface Props {
  current: number
  total: number
}

export default function StepIndicator({ current, total }: Props) {
  const progress = (current / total) * 100

  return (
    <div className="mb-6">
      <p className="text-text-secondary text-sm mb-2">
        Step {current} of {total}
      </p>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
