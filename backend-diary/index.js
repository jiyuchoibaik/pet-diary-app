// index.js (Diary Service - isPublic 기능 추가)

const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
// [추가] 파일 시스템 경로 관리를 위해 path 모듈 임포트
const path = require('path');
require('dotenv').config();

// 🚨 [필수 추가] 환경 변수를 process.env에서 읽어와 선언합니다.
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI; 
const REDIS_HOST = process.env.REDIS_HOST; 

// [추가] Diary 모델과 authMiddleware 임포트
const Diary = require('./models/Diary');
const authMiddleware = require('./middleware/authMiddleware');

// 🌟 [AI 연동] 라이브러리 임포트
const multer = require('multer');

const app = express();
app.use(express.json());
// 💡 [수정] 정적 파일 서빙을 위한 경로 추가 (이미지 경로 문제 해결을 위해)
// /uploads 경로로 들어오는 요청을 로컬 uploads 폴더로 연결합니다.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🌟 [AI 연동] Multer 설정 (메모리에 임시 저장)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// 1. MongoDB 연결
// ... (connectToMongoDB 함수는 변경 없음) ...
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { 
      user: process.env.MONGO_USERNAME, 
      pass: process.env.MONGO_PASSWORD,
      authSource: "admin"
    });
    console.log('Diary Service: MongoDB Connected');
  } catch (err) {
    console.error('Diary Service: MongoDB Connection Error:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectToMongoDB, 5000);
  }
};

// 2. Redis 연결
const redisClient = redis.createClient({
  socket: { host: REDIS_HOST, port: 6379 }
});
redisClient.on('connect', () => console.log('Diary Service: Redis Connected'));
redisClient.on('error', (err) => console.error('Diary Service: Redis Connection Error:', err));

// 3. [호출]
connectToMongoDB();
redisClient.connect();


// ==========================================
// 🚨 Mongoose populate를 위한 User 모델 스텁 등록 (수정된 코드) 🚨
// ==========================================
// 💡 [오타 수정] 'new'를 한 번만 사용합니다.
const UserSchema = new mongoose.Schema({ 
    // Auth Service의 User 모델에 있는 필드 중 populate에 필요한 필드만 정의합니다.
    username: { type: String }, 
    // Auth Service의 User 모델의 컬렉션 이름이 'users'라고 가정하고 옵션에 추가합니다.
}, { collection: 'users' }); 

// User 모델이 이미 등록되어 있는지 확인하고, 없으면 등록합니다.
if (!mongoose.models.User) {
    mongoose.model('User', UserSchema);
    console.log('Diary Service: Registered minimal User model for population.');
}
// ==========================================


// ------------------------------------------
// 🌟 New API: 전체 공개 일기 조회 (인증 불필요) 🌟
// ------------------------------------------
// 이 라우트는 authMiddleware가 적용되기 전에 위치해야 합니다.
app.get('/public', async (req, res) => {
    try {
        // isPublic이 true인 일기만 조회하고, 최신순으로 정렬
        const publicDiaries = await Diary.find({ isPublic: true })
            // 💡 [필드명 수정] 경로를 스키마 필드 이름인 'user' (소문자)로 변경합니다.
            .sort({ createdAt: -1 });


        res.json(publicDiaries);
    } catch (error) {
        // 💡 실제 오류를 콘솔에 출력하여 디버깅을 돕습니다.
        console.error('Error in /public API:', error.message);
        res.status(500).json({ message: 'Error fetching public diaries', error: error.message });
    }
});


// 🌟 [중요] /api/diary/ (이하) 모든 라우트에 'authMiddleware'를 적용
// 아래 라우트들은 반드시 로그인해야만 접근 가능합니다.
app.use(authMiddleware);

// ------------------------------------------
// 🌟 C.R.U.D API 수정 🌟
// ------------------------------------------

// 1. [Create] 새 일기 작성 (POST /)
app.post('/', upload.single('image'), async (req, res) => {
  // 🌟 [수정] isPublic을 req.body에서 추가로 받아옵니다.
  const { title, content, isPublic } = req.body; 
  const file = req.file;
  const userId = req.user.id; 

  // content 유효성 검사 추가
  if (!title || !file || !content) { 
    return res.status(400).json({ message: 'Title, content, and image file are required' });
  }

  try {
    // 💡 이미지 저장 로직: 현재 placeholder 대신 실제 파일 저장을 위한 Multer 설정이 필요하지만,
    // 이 파일은 AI 제거 버전이므로 임시로 'placeholder'를 사용합니다.
    const imageUrl = "placeholder_for_simple_upload"; 
    
    const newDiary = new Diary({
      user: userId,
      title: title,
      content: content, 
      imageUrl: imageUrl, 
      // 🌟 isPublic 저장: form-data로 오면 문자열 'true'/'false'로 오므로 Boolean으로 변환
      isPublic: isPublic === 'true', 
      aiAnalysis: {
        species: null, 
        action: null      
      }
    });

    await newDiary.save();
    res.status(201).json(newDiary);

  } catch (error) {
    console.error('Error creating diary:', error.message);
    res.status(500).json({ message: 'Error creating diary', error: error.message });
  }
}); 

// 2. [Read] "나의" 모든 일기 조회 (GET /)
// ... (변경 없음) ...
app.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const diaries = await Diary.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(diaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching diaries', error: error.message });
  }
});

// 3. [Read] 특정 일기 1개 조회 (GET /:id)
// ... (변경 없음) ...
app.get('/:id', async (req, res) => {
  const diaryId = req.params.id;
  const userId = req.user.id;
  try {
    const diary = await Diary.findById(diaryId);
    if (!diary) {
      return res.status(404).json({ message: 'Diary not found' });
    }
    // [보안] 이 일기가 "내 것"이 맞는지 확인
    if (diary.user.toString() !== userId) {
      // 💡 [개선] 만약 일기가 공개 상태라면 주인 아니어도 볼 수 있게 허용 가능.
      // 현재는 수정 페이지용이므로 주인이 아니면 차단 유지
      return res.status(403).json({ message: 'Forbidden: You do not own this diary' });
    }
    res.status(200).json(diary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching diary', error: error.message });
  }
});

// 4. [Update] 특정 일기 수정 (PUT /:id)
app.put('/:id', async (req, res) => {
  const diaryId = req.params.id;
  const userId = req.user.id;
  // 🌟 [수정] isPublic을 req.body에서 추가로 받아옵니다.
  const { title, content, isPublic } = req.body; 

  try {
    const diary = await Diary.findById(diaryId);
    if (!diary) {
      return res.status(404).json({ message: 'Diary not found' });
    }
    // [보안] "내 것"인지 확인
    if (diary.user.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this diary' });
    }

    // 수정 및 저장
    diary.title = title !== undefined ? title : diary.title;
    diary.content = content !== undefined ? content : diary.content;
    
    // 🌟 isPublic 값 업데이트: JSON body로 오므로 Boolean 값이 바로 들어옵니다.
    if (isPublic !== undefined) {
      diary.isPublic = isPublic;
    }
    
    const updatedDiary = await diary.save();
    res.status(200).json(updatedDiary);
    
  } catch (error) {
    res.status(500).json({ message: 'Error updating diary', error: error.message });
  }
});

// 5. [Delete] 특정 일기 삭제 (DELETE /:id)
// ... (변경 없음) ...
app.delete('/:id', async (req, res) => {
  const diaryId = req.params.id;
  const userId = req.user.id;

  try {
    const diary = await Diary.findById(diaryId);
    if (!diary) {
      return res.status(404).json({ message: 'Diary not found' });
    }
    if (diary.user.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this diary' });
    }

    await Diary.deleteOne({ _id: diaryId });
    res.status(200).json({ message: 'Diary deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting diary', error: error.message });
  }
});


// 5. 서버 실행
app.listen(PORT, () => {
  console.log(`Diary Service listening on port ${PORT}`);
});
