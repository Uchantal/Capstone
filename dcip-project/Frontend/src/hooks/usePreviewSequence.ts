import { useLocation } from 'react-router-dom'

export interface PreviewPage {
  label: string
  path: string
}

export interface PreviewDiscipline {
  title: string
  slug: string
  pages: PreviewPage[]
}

export const DISCIPLINES: PreviewDiscipline[] = [
  {
    title: 'Music: Piano',
    slug: 'piano',
    pages: [
      { label: 'Virtual Instrument',               path: '/piano/virtual-instrument' },
      { label: 'Course 1: Understanding the Piano', path: '/piano/understanding-the-piano' },
      { label: 'Course 2: How Notes Build Chords',  path: '/piano/notes-build-chords' },
      { label: 'Level 1 (Learn)',                   path: '/piano/level-1' },
      { label: 'Level 1 Practise',                  path: '/piano/level-1/practise' },
      { label: 'Level 1 Demonstrate',               path: '/piano/level-1/demonstrate' },
      { label: 'Level 2 (Learn)',                   path: '/piano/level-2' },
      { label: 'Level 2 Practise',                  path: '/piano/level-2/practise' },
      { label: 'Level 2 Demonstrate',               path: '/piano/level-2/demonstrate' },
      { label: 'Level 3 (Learn)',                   path: '/piano/level-3' },
      { label: 'Level 3 Practise',                  path: '/piano/level-3/practise' },
      { label: 'Level 3 Demonstrate',               path: '/piano/level-3/demonstrate' },
      { label: 'Sharpening Myself',                 path: '/piano/sharpening-myself' },
      { label: 'Production',                        path: '/piano/production' },
    ],
  },
  {
    title: 'Music: Guitar',
    slug: 'guitar',
    pages: [
      { label: 'Virtual Instrument',               path: '/guitar/virtual-instrument' },
      { label: 'Course 1: Reading the Fretboard',  path: '/guitar/reading-the-fretboard' },
      { label: 'Course 2: Notes Across the Neck',  path: '/guitar/notes-across-the-neck' },
      { label: 'Level 1 (Learn)',                  path: '/guitar/level-1' },
      { label: 'Level 1 Practise',                 path: '/guitar/level-1/practise' },
      { label: 'Level 1 Demonstrate',              path: '/guitar/level-1/demonstrate' },
      { label: 'Level 2 (Learn)',                  path: '/guitar/level-2' },
      { label: 'Level 2 Practise',                 path: '/guitar/level-2/practise' },
      { label: 'Level 2 Demonstrate',              path: '/guitar/level-2/demonstrate' },
      { label: 'Level 3 (Learn)',                  path: '/guitar/level-3' },
      { label: 'Level 3 Practise',                 path: '/guitar/level-3/practise' },
      { label: 'Level 3 Demonstrate',              path: '/guitar/level-3/demonstrate' },
      { label: 'Sharpening Myself',                path: '/guitar/sharpening-myself' },
      { label: 'Production',                       path: '/guitar/production' },
    ],
  },
  {
    title: 'Music: Voice',
    slug: 'voice',
    pages: [
      { label: 'Voice Studio',                      path: '/voice/studio' },
      { label: 'Course 1: Posture, Breath, Voice',  path: '/voice/posture-breath-voice' },
      { label: 'Course 2: Pitch and Scale',         path: '/voice/pitch-and-scale' },
      { label: 'Level 1 (Learn)',                   path: '/voice/level-1' },
      { label: 'Level 1 Practise',                  path: '/voice/level-1/practise' },
      { label: 'Level 1 Demonstrate',               path: '/voice/level-1/demonstrate' },
      { label: 'Level 2 (Learn)',                   path: '/voice/level-2' },
      { label: 'Level 2 Practise',                  path: '/voice/level-2/practise' },
      { label: 'Level 2 Demonstrate',               path: '/voice/level-2/demonstrate' },
      { label: 'Level 3 (Learn)',                   path: '/voice/level-3' },
      { label: 'Level 3 Practise',                  path: '/voice/level-3/practise' },
      { label: 'Level 3 Demonstrate',               path: '/voice/level-3/demonstrate' },
      { label: 'Sharpening Myself',                 path: '/voice/sharpening-myself' },
      { label: 'Production',                        path: '/voice/production' },
    ],
  },
  {
    title: 'Visual Arts',
    slug: 'visual-arts',
    pages: [
      { label: 'Virtual Canvas',      path: '/visual-arts/virtual-canvas' },
      { label: 'Course 1',            path: '/visual-arts/course-1' },
      { label: 'Course 2',            path: '/visual-arts/course-2' },
      { label: 'Level 1 (Learn)',     path: '/visual-arts/level-1' },
      { label: 'Level 1 Practise',   path: '/visual-arts/level-1/practise' },
      { label: 'Level 1 Demonstrate', path: '/visual-arts/level-1/demonstrate' },
      { label: 'Level 2 (Learn)',     path: '/visual-arts/level-2' },
      { label: 'Level 2 Practise',   path: '/visual-arts/level-2/practise' },
      { label: 'Level 2 Demonstrate', path: '/visual-arts/level-2/demonstrate' },
      { label: 'Level 3 (Learn)',     path: '/visual-arts/level-3' },
      { label: 'Level 3 Practise',   path: '/visual-arts/level-3/practise' },
      { label: 'Level 3 Demonstrate', path: '/visual-arts/level-3/demonstrate' },
      { label: 'Sharpening',          path: '/visual-arts/sharpening' },
      { label: 'Production',          path: '/visual-arts/production' },
    ],
  },
  {
    title: 'Graphic Design',
    slug: 'graphic-design',
    pages: [
      { label: 'Overview',              path: '/graphic-design/overview' },
      { label: 'Graphic Design Canvas', path: '/graphic-design/virtual-studio' },
      { label: 'Course 1',             path: '/graphic-design/course-1' },
      { label: 'Course 2',             path: '/graphic-design/course-2' },
      { label: 'Level 1 (Learn)',      path: '/graphic-design/level-1' },
      { label: 'Level 1 Practise',    path: '/graphic-design/level-1/practise' },
      { label: 'Level 1 Demonstrate',  path: '/graphic-design/level-1/demonstrate' },
      { label: 'Level 2 (Learn)',      path: '/graphic-design/level-2' },
      { label: 'Level 2 Practise',    path: '/graphic-design/level-2/practise' },
      { label: 'Level 2 Demonstrate',  path: '/graphic-design/level-2/demonstrate' },
      { label: 'Level 3 (Learn)',      path: '/graphic-design/level-3' },
      { label: 'Level 3 Practise',    path: '/graphic-design/level-3/practise' },
      { label: 'Level 3 Demonstrate',  path: '/graphic-design/level-3/demonstrate' },
      { label: 'Sharpening',           path: '/graphic-design/sharpening' },
      { label: 'Production',           path: '/graphic-design/production' },
    ],
  },
]

export interface PreviewSequenceResult {
  discipline: PreviewDiscipline | null
  disciplineIdx: number
  pageIdx: number
  totalPages: number
  pageLabel: string
  prevPath: string | null
  nextPath: string | null
  disciplines: PreviewDiscipline[]
}

export function usePreviewSequence(): PreviewSequenceResult {
  const { pathname } = useLocation()

  let disciplineIdx = -1
  let pageIdx = -1

  outer: for (let di = 0; di < DISCIPLINES.length; di++) {
    for (let pi = 0; pi < DISCIPLINES[di].pages.length; pi++) {
      if (DISCIPLINES[di].pages[pi].path === pathname) {
        disciplineIdx = di
        pageIdx = pi
        break outer
      }
    }
  }

  const discipline = disciplineIdx >= 0 ? DISCIPLINES[disciplineIdx] : null
  const page       = discipline && pageIdx >= 0 ? discipline.pages[pageIdx] : null

  return {
    discipline,
    disciplineIdx,
    pageIdx,
    totalPages: discipline ? discipline.pages.length : 0,
    pageLabel:  page ? page.label : '',
    prevPath:   discipline && pageIdx > 0
      ? discipline.pages[pageIdx - 1].path
      : null,
    nextPath:   discipline && pageIdx < discipline.pages.length - 1
      ? discipline.pages[pageIdx + 1].path
      : null,
    disciplines: DISCIPLINES,
  }
}
