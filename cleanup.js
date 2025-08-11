const cloudinary = require('cloudinary').v2;

// 設定 Cloudinary (會自動從環境變數讀取 CLOUDINARY_URL)
cloudinary.config();

async function cleanup() {
  try {
    console.log('開始清理 Cloudinary 舊檔案...');
    
    // 取得 7 天前的日期
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 列出所有影片資源
    const resources = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500,
      prefix: 'instagram' // 如果您有使用特定前綴
    });
    
    console.log(`找到 ${resources.resources.length} 個影片`);
    
    // 篩選出 7 天前的檔案
    const toDelete = resources.resources.filter(resource => {
      const uploadDate = new Date(resource.created_at);
      return uploadDate < sevenDaysAgo;
    });
    
    console.log(`準備刪除 ${toDelete.length} 個舊檔案`);
    
    if (toDelete.length > 0) {
      // 提取 public_ids
      const publicIds = toDelete.map(r => r.public_id);
      
      // 批次刪除（最多一次 100 個）
      const batchSize = 100;
      for (let i = 0; i < publicIds.length; i += batchSize) {
        const batch = publicIds.slice(i, i + batchSize);
        const result = await cloudinary.api.delete_resources(batch, {
          resource_type: 'video'
        });
        console.log(`刪除批次 ${Math.floor(i/batchSize) + 1}:`, result);
      }
    }
    
    console.log('清理完成！');
    
  } catch (error) {
    console.error('清理過程發生錯誤:', error);
    process.exit(1);
  }
}

// 執行清理
cleanup();
