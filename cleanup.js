const cloudinary = require('cloudinary').v2;

// 設定 Cloudinary (會自動從環境變數讀取 CLOUDINARY_URL)
cloudinary.config();

// 可以調整的參數
const DAYS_TO_KEEP = 0; // 保留最近幾天的檔案
const DELETE_ALL = false; // 是否刪除所有檔案（測試用）

async function cleanup() {
  try {
    console.log('開始清理 Cloudinary 舊檔案...');
    console.log(`設定：保留最近 ${DAYS_TO_KEEP} 天的檔案`);
    
    // 取得指定天數前的日期
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    
    console.log(`刪除早於 ${cutoffDate.toLocaleDateString()} 的檔案`);
    
    // 列出所有影片資源
    const resources = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500
    });
    
    console.log(`\n找到 ${resources.resources.length} 個影片：`);
    
    // 顯示所有檔案資訊
    resources.resources.forEach((resource, index) => {
      const uploadDate = new Date(resource.created_at);
      console.log(`${index + 1}. ${resource.public_id} - 上傳於 ${uploadDate.toLocaleDateString()}`);
    });
    
    // 篩選要刪除的檔案
    let toDelete = [];
    
    if (DELETE_ALL) {
      // 測試模式：刪除所有檔案
      toDelete = resources.resources;
      console.log('\n⚠️  測試模式：準備刪除所有檔案！');
    } else {
      // 正常模式：只刪除舊檔案
      toDelete = resources.resources.filter(resource => {
        const uploadDate = new Date(resource.created_at);
        return uploadDate < cutoffDate;
      });
    }
    
    console.log(`\n準備刪除 ${toDelete.length} 個檔案`);
    
    if (toDelete.length > 0) {
      console.log('即將刪除的檔案：');
      toDelete.forEach((resource, index) => {
        const uploadDate = new Date(resource.created_at);
        console.log(`- ${resource.public_id} (${uploadDate.toLocaleDateString()})`);
      });
      
      // 確認刪除
      console.log('\n開始刪除...');
      
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
      
      console.log('\n✅ 刪除完成！');
    } else {
      console.log('\n✅ 沒有需要刪除的檔案');
    }
    
    // 顯示剩餘檔案
    const remaining = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500
    });
    
    console.log(`\n目前剩餘 ${remaining.resources.length} 個檔案`);
    
  } catch (error) {
    console.error('清理過程發生錯誤:', error);
    process.exit(1);
  }
}

// 執行清理
cleanup();
