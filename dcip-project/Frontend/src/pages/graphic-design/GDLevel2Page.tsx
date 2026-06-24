import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel2Page() {
  return (
    <GDLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Redesign for a Different Audience"
      brief="The same creative talent evening now also needs a version for a formal invitation sent to parents and local community leaders. The tone needs to feel trustworthy and calm rather than loud and exciting. The audience reading this version is adults in a formal context, not teenagers on a noticeboard."
      task="Your Level 1 design is loaded below. Change the colours and arrangement to suit a calmer, more formal tone for an adult audience. Adjust text sizes, element positions, and colours. You may add or remove elements."
      reasoningPrompt="Why did you change the colours and layout for this audience, and how does it feel different from your Level 1 version?"
      nextPath="/graphic-design/level-2/practise"
      stageId="gd-level-2"
      requires={[]}
      initialPosterLevel={1}
    />
  )
}
