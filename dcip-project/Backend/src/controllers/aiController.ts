import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import { callAI, AIMessageContent } from '../config/openrouter'

export async function testAI(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const reply = await callAI([
      { role: 'user', content: 'Reply with exactly: DCIP AI connection working.' },
    ])
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'AI request failed' })
  }
}

const GD_SYSTEM = `You are an expert graphic design teacher assessing poster work by secondary school students (ages 14-18).
Level 1 focus: typography hierarchy — dominant title, varied font sizes, readable text.
Level 2 focus: colour contrast — text readable against background, intentional colour use.
Level 3 focus: full composition — hierarchy, contrast, balance, whitespace, and completeness.

Respond ONLY with valid JSON in one of these two formats:

If you can assess the work:
{"needsExplanation":false,"score":75,"feedback":"2-3 encouraging sentences of specific feedback.","suggestions":["specific suggestion 1","specific suggestion 2"]}

If the poster is completely blank, random, or impossible to assess as a design:
{"needsExplanation":true,"question":"What was this poster designed to communicate or announce?"}

Score 0-100 based on how well the design demonstrates the level's principles. No text outside the JSON.`

const VA_SYSTEM = `You are an expert visual arts teacher assessing drawings by secondary school students (ages 14-18).
Visual arts is subjective — assess effort, intentionality, and basic principles, not professional quality.
Look for: recognisable shapes or elements, intentional colour use, visible shading or texture, compositional thought.

Respond ONLY with valid JSON in one of these two formats:

If you can assess the work:
{"needsExplanation":false,"score":75,"feedback":"2-3 encouraging sentences of specific feedback.","suggestions":["specific suggestion 1","specific suggestion 2"]}

If the drawing is blank, completely unclear, or shows no intentional composition:
{"needsExplanation":true,"question":"What were you trying to draw, and what inspired you to create this?"}

Score generously for genuine effort. No text outside the JSON.`

export async function critiqueArtwork(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { imageData, discipline, level, explanation } = req.body as {
      imageData: string
      discipline: string
      level: number
      explanation?: string
    }

    if (!imageData || !discipline) {
      res.status(400).json({ message: 'imageData and discipline are required' })
      return
    }

    const systemPrompt = discipline === 'graphic-design' ? GD_SYSTEM : VA_SYSTEM
    const subject = discipline === 'graphic-design' ? 'Graphic Design poster' : 'Visual Arts drawing'

    const userContent: AIMessageContent[] = [
      { type: 'image_url', image_url: { url: imageData } },
      {
        type: 'text',
        text: explanation
          ? `This is a Level ${level} ${subject}. The student explained: "${explanation}". Please give your full assessment now.`
          : `This is a Level ${level} ${subject}. Please assess it.`,
      },
    ]

    const raw = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userContent },
    ])

    let result: Record<string, unknown>
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      result = { needsExplanation: false, feedback: raw.slice(0, 400), suggestions: [] }
    }

    res.json(result)
  } catch (err) {
    console.error('critiqueArtwork error:', err)
    res.status(500).json({ message: err instanceof Error ? err.message : 'AI critique failed' })
  }
}

export async function askCourseHint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { selectedText, discipline, context, imageData } = req.body as {
      selectedText: string
      discipline: string
      context?: string
      imageData?: string
    }

    if (!selectedText || !discipline) {
      res.status(400).json({ message: 'selectedText and discipline are required' })
      return
    }

    const systemPrompt = `You are a helpful tutor for secondary school students (ages 14-18) learning creative arts on the DCIP platform. The student is currently studying ${discipline}${context ? ` (${context})` : ''}.

DCIP platform knowledge (use only when the student asks about platform features):
- Each discipline has Levels 1-3, each with three stages: Learn, Practise, and Demonstrate.
- "Submit" means clicking "Submit and Continue" on the Demonstrate page to earn a badge. It is not bug reporting.
- "Check my work" verifies the work before submitting. "Badge" is earned by completing a level. "Canvas" is the drawing area.
- "Engagement score" measures how actively the student used the canvas tools.

How to answer:
1. If the student uploads an image — look at what is actually in the image and answer their question about it directly. Describe what you see honestly. Do not assume the image is from DCIP or from any specific lesson. The student may upload any image they are curious about — a musical instrument, a painting, a drawing technique, anything.
2. If the student asks a question about their ${discipline} discipline — answer it clearly as a ${discipline} teacher would, using simple beginner-friendly language.
3. If the student asks about a DCIP platform feature — explain it using the platform knowledge above.

Rules: answer in 2-3 sentences maximum. No emojis. No bullet lists in your answer. Simple clear language. Never guess or invent details you cannot see.`

    const userContent: import('../config/openrouter').AIMessageContent[] | string = imageData
      ? [
          { type: 'image_url', image_url: { url: imageData } },
          { type: 'text', text: selectedText },
        ]
      : selectedText

    const hint = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userContent },
    ])

    res.json({ hint })
  } catch (err) {
    console.error('askCourseHint error:', err)
    res.status(500).json({ message: err instanceof Error ? err.message : 'AI hint failed' })
  }
}
