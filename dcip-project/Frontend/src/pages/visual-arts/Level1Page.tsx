import VisualArtsLevelScreen from '../../components/visual-arts/VisualArtsLevelScreen'

const CHECKLIST = [
  { id: 'three-shapes',    text: 'I have drawn at least three distinct shapes' },
  { id: 'two-tools',       text: 'I used at least two different drawing tools (not only the Brush)' },
  { id: 'line-quality',    text: 'I am satisfied with the line quality of my shapes' },
]

export default function VALevel1Page() {
  return (
    <VisualArtsLevelScreen
      levelNumber={1}
      totalLevels={3}
      levelTitle="Level 1: Shapes and Lines in Practice"
      task="Draw at least three different basic shapes, for example a circle, a square, and a triangle, using the Line, Rectangle, and Ellipse tools. Try to keep your shapes clean and intentional. Experiment with both Outline and Fill modes."
      checklist={CHECKLIST}
      nextPath="/visual-arts/level-2"
      stageId="va-level-1"
      requires={['va-course-1', 'va-course-2']}
    />
  )
}
