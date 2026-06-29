import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import StudioWork from '../models/StudioWork'
import cloudinary from '../config/cloudinary'

const CLOUDINARY_FOLDER = 'dcip-studio'

async function uploadToCloudinary(
  dataUrl: string,
  fileType: string,
  publicId: string,
): Promise<{ url: string; publicId: string }> {
  const resourceType = fileType.startsWith('audio/') ? 'video' : 'image'
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder:        CLOUDINARY_FOLDER,
    public_id:     publicId,
    resource_type: resourceType,
    overwrite:     true,
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export async function saveStudioWork(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, discipline, fileData, fileType, width, height, format } = req.body

    const cloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'

    let fileUrl: string | undefined
    let cloudinaryPublicId: string | undefined
    let storedFileData: string | undefined

    if (cloudinaryConfigured && fileData) {
      const publicId = `${req.userId}-${Date.now()}`
      const uploaded = await uploadToCloudinary(fileData, fileType || 'image/png', publicId)
      fileUrl = uploaded.url
      cloudinaryPublicId = uploaded.publicId
    } else {
      // Cloudinary not configured — fall back to storing in MongoDB
      storedFileData = fileData
    }

    const work = await StudioWork.create({
      user:               req.userId,
      title,
      discipline,
      fileData:           storedFileData,
      fileUrl,
      cloudinaryPublicId,
      fileType:           fileType  || 'image/png',
      width:              width     || 1920,
      height:             height    || 1080,
      format:             format    || 'HD 16:9',
    })

    const { fileData: _omit, ...meta } = work.toObject()
    res.status(201).json(meta)
  } catch (err) {
    console.error('saveStudioWork error:', err)
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
    const work = await StudioWork.findOne({ _id: req.params.id, user: req.userId })
    if (!work) { res.status(404).json({ message: 'Not found' }); return }

    if (work.cloudinaryPublicId) {
      const resourceType = work.fileType?.startsWith('audio/') ? 'video' : 'image'
      await cloudinary.uploader.destroy(work.cloudinaryPublicId, { resource_type: resourceType })
        .catch(() => { /* non-fatal — file may have already been deleted */ })
    }

    await work.deleteOne()
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Failed to delete studio work' })
  }
}
