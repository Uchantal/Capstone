import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel3Page() {
  return (
    <GDLevelScreen
      levelNumber={3}
      totalLevels={3}
      levelTitle="Level 3: A Two-Piece Campaign"
      brief="You now need both versions to work together as one campaign. The noticeboard poster and the formal invitation should clearly look like they belong to the same event, while still being right for their different audiences. A campaign feels coherent when certain elements are shared across pieces: the same title wording, the same accent colour, the same alignment pattern, or the same overall structure."
      task="Your Level 2 design is loaded below and your Level 1 design is shown above for reference. Make at least one deliberate choice that connects the two pieces so they feel like one campaign, while keeping what makes each right for its audience."
      reasoningPrompt="What did you keep consistent between the two posters, and why does that help them feel like one campaign?"
      nextPath="/graphic-design/level-3/practise"
      stageId="gd-level-3"
      requires={[]}
      initialPosterLevel={2}
      referencePosterLevel={1}
    />
  )
}
