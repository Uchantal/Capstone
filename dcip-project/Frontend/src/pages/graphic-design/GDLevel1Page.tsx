import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel1Page() {
  return (
    <GDLevelScreen
      levelNumber={1}
      totalLevels={3}
      levelTitle="Level 1: Design a Poster for a Real Announcement"
      brief="Your school is hosting a creative talent evening open to all students. Design a poster announcing it. The audience is teenagers who will see this poster on a noticeboard from a few metres away, so the most important information must be readable instantly."
      task="Add at least two text elements: a large title for the event and a smaller subtitle. Use font size and position to make the title clearly dominant. Add a background colour and at least one shape to complete the composition."
      reasoningPrompt="Why did you choose this layout and hierarchy? How does it help someone reading the poster quickly?"
      nextPath="/graphic-design/level-1/practise"
      stageId="gd-level-1"
      requires={['gd-course-1', 'gd-course-2']}
      planningNoteLevel={0}
    />
  )
}
