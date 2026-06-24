import { Level3Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel3Page() {
  const { markComplete } = useGuitarProgress()

  return (
    <Level3Screen
      onComplete={() => markComplete('guitar-level-3')}
      nextPath="/guitar/level-3/practise"
    />
  )
}
