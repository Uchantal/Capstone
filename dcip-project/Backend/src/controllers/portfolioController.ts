import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import PortfolioItem from '../models/PortfolioItem'
import PracticeSession from '../models/PracticeSession'

export const savePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { discipline, title, fileType, fileData, durationMinutes } = req.body

    if (!discipline || !title || !fileData) {
      res.status(400).json({ message: 'discipline, title, and fileData are required' })
      return
    }

    // Create a session record alongside the portfolio item
    const session = await PracticeSession.create({
      user: req.userId,
      discipline,
      durationMinutes: durationMinutes || 0,
      syncStatus: 'synced',
    })

    const item = await PortfolioItem.create({
      user: req.userId,
      session: session._id,
      discipline,
      title,
      fileType: fileType || 'image/png',
      fileData,
      syncStatus: 'synced',
    })

    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: 'Could not save portfolio item' })
  }
}

export const getMyPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await PortfolioItem.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select('-fileData') // exclude base64 from list view for performance
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch portfolio' })
  }
}

export const getPortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findOne({ _id: req.params.id, user: req.userId })
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch item' })
  }
}

export const deletePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await PortfolioItem.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Could not delete item' })
  }
}
