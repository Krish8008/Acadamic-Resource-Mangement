import { toast } from 'sonner'

export const showError = (error, fallback) => {
  toast.error(error instanceof Error ? error.message : fallback)
}

export const showPermissionError = () => {
  toast.error('You do not have permission to perform this action.')
}
