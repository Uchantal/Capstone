import { useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

const SESSION_KEY = 'dcip-admin-preview'

export const usePreviewMode = (): boolean => {
  const { user } = useAuth()
  const { search } = useLocation()

  if (user?.role !== 'admin') return false

  const urlPreview = new URLSearchParams(search).get('preview') === 'true'
  if (urlPreview) {
    sessionStorage.setItem(SESSION_KEY, 'true')
  }

  return urlPreview || sessionStorage.getItem(SESSION_KEY) === 'true'
}
