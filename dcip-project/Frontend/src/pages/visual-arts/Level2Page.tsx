import VisualArtsLevelScreen from '../../components/visual-arts/VisualArtsLevelScreen'

const CHECKLIST = [
  { id: 'circle-drawn',   text: 'I have drawn one circle using the Ellipse tool' },
  { id: 'two-zones',      text: 'I have shaded at least two different tone areas on the circle' },
  { id: 'cast-shadow',    text: 'I have added a cast shadow beneath the circle' },
  { id: 'two-shades',     text: 'My shading uses more than one shade of colour' },
]

export default function VALevel2Page() {
  return (
    <VisualArtsLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Practising Light and Shadow"
      task="Draw one circle using the Ellipse tool. Using the Brush, shade it to show the five zones you learned in Course 2: highlight, midtone, core shadow, reflected light, and cast shadow. Use a darker colour for the shadow areas and leave the highlight area lighter or unshaded."
      checklist={CHECKLIST}
      nextPath="/visual-arts/level-3"
      stageId="va-level-2"
      requires={['va-level-1']}
    />
  )
}
