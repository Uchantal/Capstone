import { Router } from 'express'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import JourneyProgress from '../models/JourneyProgress'
import PianoDemonstrationProgress from '../models/PianoDemonstrationProgress'
import GuitarDemonstrationProgress, { computeGuitarSkillLevel } from '../models/GuitarDemonstrationProgress'
import VisualArtsDemonstrationProgress, { computeVisualArtsSkillLevel } from '../models/VisualArtsDemonstrationProgress'
import GDDemonstrationProgress, { computeGDSkillLevel } from '../models/GDDemonstrationProgress'
import VoiceDemonstrationProgress, { computeVoiceSkillLevel } from '../models/VoiceDemonstrationProgress'
import StudentProgress from '../models/StudentProgress'

const router = Router()

// Stage IDs that count as a "level completed" for the summary stat.
const LEVEL_STAGE_IDS = [
  'va-level-1-demo', 'va-level-2-demo', 'va-level-3-demo',
  'gd-level-1-demo', 'gd-level-2-demo', 'gd-level-3-demo',
  'guitar-level-1-demo', 'guitar-level-2-demo', 'guitar-level-3-demo',
  'piano-level-1-demo', 'piano-level-2-demo', 'piano-level-3-demo',
  'voice-level-1-demo', 'voice-level-2-demo', 'voice-level-3-demo',
]

interface DisciplineResult {
  key: string
  label: string
  completedStages: string[]
  skillLevel: string
  totalSessions: number
  totalMinutes: number
}

function computeJourneySkill(stages: string[], prefix: string): string {
  if (stages.includes(`${prefix}-production`)) return 'advanced'
  if (stages.includes(`${prefix}-level-3`)) return 'intermediate'
  if (stages.includes(`${prefix}-level-1`)) return 'beginner'
  if (stages.length > 0) return 'getting-started'
  return 'not-started'
}

// GET /api/progress/summary
router.get('/summary', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId

    const [journeyRecords, pianoDemo, guitarDemo, vaDemo, gdDemo, voiceDemo, allSessionProgress] = await Promise.all([
      JourneyProgress.find({ user: userId }),
      PianoDemonstrationProgress.findOne({ user: userId }),
      GuitarDemonstrationProgress.findOne({ user: userId }),
      VisualArtsDemonstrationProgress.findOne({ user: userId }),
      GDDemonstrationProgress.findOne({ user: userId }),
      VoiceDemonstrationProgress.findOne({ user: userId }),
      StudentProgress.find({ user: userId }),
    ])

    const sessionByDisc = (key: string) => {
      const sp = allSessionProgress.find(s => s.discipline === key)
      return { totalSessions: sp?.totalSessions ?? 0, totalMinutes: sp?.totalMinutes ?? 0 }
    }

    const disciplines: DisciplineResult[] = []

    // ── Piano ────────────────────────────────────────────────────────────────
    const pianoJourney = journeyRecords.find(j => j.discipline === 'piano')
    const pianoStages: string[] = [...(pianoJourney?.completedStages ?? [])]
    if (pianoDemo?.level1DemonstrationPassed) pianoStages.push('piano-level-1-demo')
    if (pianoDemo?.level2DemonstrationPassed) pianoStages.push('piano-level-2-demo')
    if (pianoDemo?.level3DemonstrationPassed) pianoStages.push('piano-level-3-demo')
    if (pianoDemo?.productionPassed)          pianoStages.push('piano-production-demo')

    let pianoSkill = 'not-started'
    if (pianoDemo?.productionPassed) pianoSkill = 'advanced'
    else if (pianoDemo?.level3DemonstrationPassed || pianoDemo?.level2DemonstrationPassed) pianoSkill = 'intermediate'
    else if (pianoDemo?.level1DemonstrationPassed) pianoSkill = 'beginner'
    else if (pianoStages.length > 0) pianoSkill = 'getting-started'

    const pianoSessions = sessionByDisc('music-piano')
    if (pianoStages.length > 0 || pianoSessions.totalSessions > 0) {
      disciplines.push({ key: 'piano', label: 'Piano', completedStages: pianoStages, skillLevel: pianoSkill, ...pianoSessions })
    }

    // ── Visual Arts ──────────────────────────────────────────────────────────
    const vaJourney = journeyRecords.find(j => j.discipline === 'visual-arts')
    const vaBaseStages: string[] = [...(vaJourney?.completedStages ?? [])]
    if (vaDemo?.level1DemonstrationPassed) vaBaseStages.push('va-level-1-demo')
    if (vaDemo?.level2DemonstrationPassed) vaBaseStages.push('va-level-2-demo')
    if (vaDemo?.level3DemonstrationPassed) vaBaseStages.push('va-level-3-demo')
    if (vaDemo?.productionPassed)          vaBaseStages.push('va-production-demo')

    let vaSkill = 'not-started'
    if (vaDemo) vaSkill = computeVisualArtsSkillLevel(vaDemo)
    else if (vaBaseStages.length > 0) vaSkill = 'getting-started'

    const vaSessions = sessionByDisc('visual-arts')
    if (vaBaseStages.length > 0 || vaSessions.totalSessions > 0) {
      disciplines.push({ key: 'visual-arts', label: 'Visual Arts', completedStages: vaBaseStages, skillLevel: vaSkill, ...vaSessions })
    }

    // ── Graphic Design ───────────────────────────────────────────────────────
    const gdJourney = journeyRecords.find(j => j.discipline === 'graphic-design')
    const gdBaseStages: string[] = [...(gdJourney?.completedStages ?? [])]
    if (gdDemo?.level1DemonstrationPassed) gdBaseStages.push('gd-level-1-demo')
    if (gdDemo?.level2DemonstrationPassed) gdBaseStages.push('gd-level-2-demo')
    if (gdDemo?.level3DemonstrationPassed) gdBaseStages.push('gd-level-3-demo')
    if (gdDemo?.productionPassed)          gdBaseStages.push('gd-production-demo')

    let gdSkill = 'not-started'
    if (gdDemo) gdSkill = computeGDSkillLevel(gdDemo)
    else if (gdBaseStages.length > 0) gdSkill = 'getting-started'

    const gdSp = allSessionProgress.find(s => s.discipline === 'graphic-design' || s.discipline === 'music-graphic-design')
    const gdSessions = { totalSessions: gdSp?.totalSessions ?? 0, totalMinutes: gdSp?.totalMinutes ?? 0 }
    if (gdBaseStages.length > 0 || gdSessions.totalSessions > 0) {
      disciplines.push({ key: 'graphic-design', label: 'Graphic Design', completedStages: gdBaseStages, skillLevel: gdSkill, ...gdSessions })
    }

    // ── Guitar ───────────────────────────────────────────────────────────────
    const guitarJourney = journeyRecords.find(j => j.discipline === 'guitar')
    const guitarBaseStages: string[] = [...(guitarJourney?.completedStages ?? [])]
    if (guitarDemo?.level1DemonstrationPassed) guitarBaseStages.push('guitar-level-1-demo')
    if (guitarDemo?.level2DemonstrationPassed) guitarBaseStages.push('guitar-level-2-demo')
    if (guitarDemo?.level3DemonstrationPassed) guitarBaseStages.push('guitar-level-3-demo')
    if (guitarDemo?.productionPassed)          guitarBaseStages.push('guitar-production-demo')

    let guitarSkill = 'not-started'
    if (guitarDemo) guitarSkill = computeGuitarSkillLevel(guitarDemo)
    else if (guitarBaseStages.length > 0) guitarSkill = 'getting-started'

    const guitarSp = allSessionProgress.find(s => s.discipline === 'guitar' || s.discipline === 'music-guitar')
    const guitarSessions = { totalSessions: guitarSp?.totalSessions ?? 0, totalMinutes: guitarSp?.totalMinutes ?? 0 }
    if (guitarBaseStages.length > 0 || guitarSessions.totalSessions > 0) {
      disciplines.push({ key: 'guitar', label: 'Guitar', completedStages: guitarBaseStages, skillLevel: guitarSkill, ...guitarSessions })
    }

    // ── Voice and Singing ────────────────────────────────────────────────────
    const voiceJourney = journeyRecords.find(j => j.discipline === 'voice')
    const voiceBaseStages: string[] = [...(voiceJourney?.completedStages ?? [])]
    if (voiceDemo?.level1DemonstrationPassed) voiceBaseStages.push('voice-level-1-demo')
    if (voiceDemo?.level2DemonstrationPassed) voiceBaseStages.push('voice-level-2-demo')
    if (voiceDemo?.level3DemonstrationPassed) voiceBaseStages.push('voice-level-3-demo')
    if (voiceDemo?.productionPassed)          voiceBaseStages.push('voice-production-demo')

    let voiceSkill = 'not-started'
    if (voiceDemo) voiceSkill = computeVoiceSkillLevel(voiceDemo)
    else if (voiceBaseStages.length > 0) voiceSkill = 'getting-started'

    const voiceSp = allSessionProgress.find(s => s.discipline === 'voice' || s.discipline === 'music-voice')
    const voiceSessions = { totalSessions: voiceSp?.totalSessions ?? 0, totalMinutes: voiceSp?.totalMinutes ?? 0 }
    if (voiceBaseStages.length > 0 || voiceSessions.totalSessions > 0) {
      disciplines.push({ key: 'voice', label: 'Voice and Singing', completedStages: voiceBaseStages, skillLevel: voiceSkill, ...voiceSessions })
    }

    const totalLevelsCompleted = disciplines.reduce((sum, d) =>
      sum + LEVEL_STAGE_IDS.filter(id => d.completedStages.includes(id)).length, 0)

    const allCreatedAts = allSessionProgress
      .map(s => s.createdAt?.getTime?.() ?? 0)
      .filter(t => t > 0)
    const activeSince = allCreatedAts.length > 0
      ? new Date(Math.min(...allCreatedAts)).toISOString()
      : null

    res.json({ disciplines, totalLevelsCompleted, activeSince })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
