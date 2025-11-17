const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiarySchema = new Schema({
  // [중요] 이 일기를 작성한 사용자의 ID
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // (auth-service의 'User' 모델을 참조한다는 의미)
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  // (나중에 AI가 채워줄) 이미지 URL
  imageUrl: {
    type: String
  },
  // (나중에 AI가 채워줄) AI 분석 결과
  aiAnalysis: {
    species: String,
    action: String
  },
  // 🌟 [추가] 공개 여부 필드
  isPublic: {
    type: Boolean,
    default: false, // 기본값은 '비공개'
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

module.exports = mongoose.model('Diary', DiarySchema);