import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import StudioWork from '../models/StudioWork'

export async function saveStudioWork(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, discipline, fileData, fileType, width, height, format } = req.body
    const work = await StudioWork.create({
      user: req.userId,
      title,
      discipline,
      fileData,
      fileType:   fileType  || 'image/png',
      width:      width     || 1920,
      height:     height    || 1080,
      format:     format    || 'HD 16:9',
    })
    const { fileData: _omit, ...meta } = work.toObject()
    res.status(201).json(meta)
  } catch {
    res.status(500).json({ message: 'Failed to save studio work' })
  }
}

export async function getStudioWorks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const works = await StudioWork.find({ user: req.userId })
      .select('-fileData')
      .sort({ createdAt: -1 })
    res.json(works)
  } catch {
    res.status(500).json({ message: 'Failed to fetch studio works' })
  }
}

export async function getStudioWork(req: AuthRequest, res: Response): Promise<void> {
  try {
    const work = await StudioWork.findOne({ _id: req.params.id, user: req.userId })
    if (!work) { res.status(404).json({ message: 'Not found' }); return }
    res.json(work)
  } catch {
    res.status(500).json({ message: 'Failed to fetch studio work' })
  }
}

export async function deleteStudioWork(req: AuthRequest, res: Response): Promise<void> {
  try {
    await StudioWork.findOneAndDelete({ _id: req.params.id, user: req.userId })
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Failed to delete studio work' })
  }
}
