const cloudinary = require('cloudinary').v2

const removeUploadedLinks = async (documents) => {
  const uploadedLinks = documents.flatMap((document) =>
    document.links.filter((link) => link.publicId),
  )

  const results = await Promise.allSettled(
    uploadedLinks.map((link) =>
      cloudinary.uploader.destroy(link.publicId, {
        resource_type: link.resourceType || 'image',
      }),
    ),
  )

  results
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.error('Unable to remove a Cloudinary asset:', result.reason))
}

module.exports = { removeUploadedLinks }
