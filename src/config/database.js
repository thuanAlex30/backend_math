import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI chưa được cấu hình trong .env');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối MongoDB');
  } catch (err) {
    if (err.code === 8000 || err.codeName === 'AtlasError') {
      console.error('\n❌ MongoDB Atlas: xác thực thất bại (bad auth)');
      console.error('   → Atlas → Database Access: kiểm tra username/password');
      console.error('   → Đổi mật khẩu user, cập nhật MONGODB_URI trong .env');
      console.error('   → Mật khẩu có @ # % phải URL-encode (vd: @ → %40)\n');
    }
    throw err;
  }
}
