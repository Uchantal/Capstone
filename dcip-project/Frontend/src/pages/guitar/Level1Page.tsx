import { Level1Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel1Page() {
  const { markComplete } = useGuitarProgress()

  return (
    <Level1Screen
      onComplete={() => markComplete('guitar-level-1')}
      nextPath="/guitar/level-1/practise"
    />
  )
}
