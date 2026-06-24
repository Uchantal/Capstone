import { Level2Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel2Page() {
  const { markComplete } = useGuitarProgress()

  return (
    <Level2Screen
      onComplete={() => markComplete('guitar-level-2')}
      nextPath="/guitar/level-2/practise"
    />
  )
}
