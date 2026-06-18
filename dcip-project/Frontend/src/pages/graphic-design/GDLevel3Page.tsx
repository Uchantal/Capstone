import GDLevelScreen from '../../components/graphic-design/GDLevelScreen'

export default function GDLevel3Page() {
  return (
    <GDLevelScreen
      levelNumber={3}
      totalLevels={3}
      levelTitle="Level 3: A Two-Piece Campaign"
      brief="You now need both versions to work together as one campaign. The noticeboard poster and the formal invitation should clearly look like they belong to the same event, while still being right for their different audiences. A campaign feels coherent when certain elements are shared across pieces: the same title wording, the same accent colour, the same alignment pattern, or the same overall structure."
      task="Your Level 1 poster is shown above for reference. Starting from your Level 2 poster (carried forward and editable below), make at least one deliberate connecting choice that ties it to your Level 1 version. Keep what makes each version right for its audience, but ensure someone who sees both instantly knows they are for the same event."
      reasoningPrompt="What did you keep consistent between the two posters, and why does that help them feel like one campaign?"
      nextPath="/graphic-design/sharpening"
      stageId="gd-level-3"
      requires={['gd-level-2']}
      initialPosterLevel={2}
      referencePosterLevel={1}
    />
  )
}
