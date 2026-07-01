import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import StudioWork from '../models/StudioWork'
import StudioFolder from '../models/StudioFolder'
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
    const { title, discipline, fileData, fileType, width, height, format, folder, newFolderName } = req.body

    let folderId: string | undefined = folder || undefined
    if (newFolderName && String(newFolderName).trim()) {
      const name = String(newFolderName).trim()
      const existing = await StudioFolder.findOne({ user: req.userId, name })
      const folderDoc = existing ?? await StudioFolder.create({ user: req.userId, name })
      folderId = String(folderDoc._id)
    }

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
      folder:             folderId,
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
    const { folder } = req.query
    const query: Record<string, unknown> = { user: req.userId }
    if (folder === 'none') query.folder = { $exists: false }
    else if (typeof folder === 'string' && folder) query.folder = folder

    const works = await StudioWork.find(query)
      .select('-fileData')
      .sort({ createdAt: -1 })
    res.json(works)
  } catch {
    res.status(500).json({ message: 'Failed to fetch studio works' })
  }
}

export async function moveStudioWork(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { folder } = req.body
    const work = await StudioWork.findOne({ _id: req.params.id, user: req.userId })
    if (!work) { res.status(404).json({ message: 'Not found' }); return }

    work.folder = folder || undefined
    await work.save()
    res.json({ message: 'Moved' })
  } catch {
    res.status(500).json({ message: 'Failed to move studio work' })
  }
}

export async function getFolders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const folders = await StudioFolder.find({ user: req.userId }).sort({ name: 1 })
    res.json(folders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch folders' })
  }
}

export async function createFolder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body
    if (!name || !name.trim()) { res.status(400).json({ message: 'Folder name is required' }); return }

    const folder = await StudioFolder.create({ user: req.userId, name: name.trim() })
    res.status(201).json(folder)
  } catch {
    res.status(500).json({ message: 'Failed to create folder' })
  }
}

export async function deleteFolder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const folder = await StudioFolder.findOne({ _id: req.params.id, user: req.userId })
    if (!folder) { res.status(404).json({ message: 'Not found' }); return }

    // Works inside the folder are not deleted — they just become uncategorized
    await StudioWork.updateMany({ user: req.userId, folder: folder._id }, { $unset: { folder: 1 } })
    await folder.deleteOne()
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ message: 'Failed to delete folder' })
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
