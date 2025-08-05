const cloudinary = require('cloudinary').v2;

async function cleanup() {
  // 刪除 7 天前的檔案
  const result = await cloudinary.api.delete_resources_by_prefix('instagram/', {
    type: 'upload',
    resource_type: 'video'
  });
  console.log('Cleaned up:', result);
}

cleanup();
