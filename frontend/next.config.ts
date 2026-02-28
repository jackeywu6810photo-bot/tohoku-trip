/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 🔥 這行最重要，沒有它就無法產生 out 資料夾
  images: {
    unoptimized: true, // 這行讓圖片在單機版也能顯示
  },
};

export default nextConfig;