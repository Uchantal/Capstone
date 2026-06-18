import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel1Page() {
  return (
    <GDLevelScreen
      levelNumber={1}
      totalLevels={3}
      levelTitle="Level 1: Design a Poster for a Real Announcement"
      brief="Your school is hosting a creative talent evening open to all students. Design a poster announcing it. The audience is teenagers who will see this poster on a noticeboard from a few metres away, so the most important information must be readable instantly."
      task="Choose a title and subtitle for the event. Apply a clear hierarchy so the title is visibly larger than the subtitle. Choose an alignment that suits a noticeboard poster glanced at quickly from a distance."
      reasoningPrompt="Why did you choose this alignment and hierarchy for a poster people will glance at quickly?"
      nextPath="/graphic-design/level-2"
      stageId="gd-level-1"
      requires={['gd-course-1', 'gd-course-2']}
      planningNoteLevel={0}
    />
  )
}
