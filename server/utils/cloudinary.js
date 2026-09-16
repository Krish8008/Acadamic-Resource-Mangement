const cloudinary = require('cloudinary').v2

const removeUploadedLinks = async (documents) => {
  const uploadedLinks = documents.flatMap((document) =>
    document.links.filter((link) => link.publicId),
  )

  await Promise.all(
    uploadedLinks.map((link) =>
      cloudinary.uploader.destroy(link.publicId, {
        resource_type: link.resourceType || 'image',
      }),
    ),
  )
}

module.exports = { removeUploadedLinks }
