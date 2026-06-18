import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel2Page() {
  return (
    <GDLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Redesign for a Different Audience"
      brief="The same creative talent evening now also needs a version for a formal invitation sent to parents and local community leaders. The tone needs to feel trustworthy and calm rather than loud and exciting. The audience reading this version is adults in a formal context, not teenagers on a noticeboard."
      task="Starting from your Level 1 poster (your title and subtitle are carried forward), change the colour scheme to suit a calmer and more formal tone. Adjust the contrast so it still reads clearly and feels trustworthy rather than urgent. You may also adjust the alignment if a different one feels more appropriate for this audience."
      reasoningPrompt="Why did you change the colours for this audience, and how does it feel different from your Level 1 version?"
      nextPath="/graphic-design/level-3"
      stageId="gd-level-2"
      requires={['gd-level-1']}
      initialPosterLevel={1}
    />
  )
}
