const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
// [추가] 파일 시스템 경로 관리를 위해 path 모듈 임포트
const path = require('path');
// 🌟 [추가] 파일 시스템 작업을 위해 fs/promises 모듈 임포트
const fs = require('fs/promises'); 
require('dotenv').config({ 
    path: path.resolve(__dirname, '..', '.env') 
});

// 🚨 [필수 추가] 환경 변수를 process.env에서 읽어와 선언합니다.
const PORT = process.env.PORT_DIARY|| 3002;
// 💡 [추가] 서비스의 기본 URL (예: http://localhost:3002)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`; 
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
// 이렇게 하면 클라이언트가 'http://localhost:3002/uploads/imageName.jpg'로 접근할 수 있습니다.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==========================================
// 🌟 Multer 설정 (디스크 저장소로 변경) 🌟
// ==========================================
// Dockerfile에 의해 WORKDIR이 /app이므로, UPLOADS_DIR은 /app/uploads가 됩니다.
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// 1. 디스크 저장소 설정
const storage = multer.diskStorage({
    // 파일을 저장할 디렉토리 설정
    destination: async (req, file, cb) => {
        // 🌟 [디버깅 로그] destination이 호출되는지 확인 (여기까지 요청이 도달해야 함)
        console.log('--- Multer Destination Called ---');
        console.log('Auth Status (req.user exists):', !!req.user);
        
        try {
            // uploads 디렉토리가 없으면 생성
            await fs.mkdir(UPLOADS_DIR, { recursive: true });
            cb(null, UPLOADS_DIR);
        } catch (error) {
            console.error('Error creating uploads directory or EACCES:', error);
            cb(error);
        }
    },
    // 저장될 파일 이름 설정
    filename: (req, file, cb) => {
        // 🌟 [디버깅 로그] req.user.id가 유효한지 확인
        if (!req.user || !req.user.id) {
            // 이 오류가 콘솔에 뜨면 JWT_SECRET 문제로 토큰 검증이 실패한 것입니다.
            console.error('CRITICAL MULTER ERROR: req.user.id is undefined. Authentication failed or missing.');
            // 파일 저장을 중단하고 에러를 발생시켜야 하지만, Multer는 내부적으로 에러를 처리하므로,
            // 여기서는 요청이 401로 차단되었을 가능성이 높습니다.
            return cb(new Error('Authentication data missing for file upload.'), null);
        }
        
        // 파일 원본 이름에서 확장자 추출
        const ext = path.extname(file.originalname);
        // 고유한 파일 이름 생성 (UserID + Timestamp + 확장자)
        const fileName = `${req.user.id}-${Date.now()}${ext}`;
        console.log('Successfully generated filename:', fileName); // 🌟 [추가] 성공 로그
        cb(null, fileName);
    }
});

// 2. Multer 인스턴스 생성
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한 (선택 사항)
});

// ==========================================


// 1. MongoDB 연결
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
const UserSchema = new mongoose.Schema({ 
    username: { type: String }, 
}, { collection: 'users' }); 

if (!mongoose.models.User) {
    mongoose.model('User', UserSchema);
    console.log('Diary Service: Registered minimal User model for population.');
}
// ==========================================


// ------------------------------------------
// 🌟 New API: 전체 공개 일기 조회 (인증 불필요) 🌟
// ------------------------------------------
app.get('/public', async (req, res) => {
    try {
        const publicDiaries = await Diary.find({ isPublic: true })
            .sort({ createdAt: -1 });
        res.json(publicDiaries);
    } catch (error) {
        console.error('Error in /public API:', error.message);
        res.status(500).json({ message: 'Error fetching public diaries', error: error.message });
    }
});


// 🌟 [중요] /api/diary/ (이하) 모든 라우트에 'authMiddleware'를 적용
app.use(authMiddleware);

// ------------------------------------------
// 🌟 C.R.U.D API 수정 🌟
// ------------------------------------------

// 1. [Create] 새 일기 작성 (POST /)
app.post('/', upload.single('image'), async (req, res) => {
  const { title, content, isPublic } = req.body; 
  const file = req.file; 
  const userId = req.user.id; 

  // content 유효성 검사 추가 (파일은 필수)
  if (!title || !file || !content) { 
    // 파일이 없는 경우, 저장된 파일이 있다면 삭제
    if (file) {
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.error('Error deleting file after validation failure:', unlinkError);
        }
    }
    return res.status(400).json({ message: 'Title, content, and an image file are required' });
  }

  try {
    // ==========================================
    // 🌟 이미지 URL 생성 로직 🌟
    // ==========================================
    const imageUrl = `${BASE_URL}/uploads/${file.filename}`;
    
    const newDiary = new Diary({
      user: userId,
      title: title,
      content: content, 
      imageUrl: imageUrl, // 🌟 생성된 공개 URL 저장
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
    // DB 저장 실패 시, 저장된 파일도 삭제하여 불필요한 파일이 남지 않도록 함 (롤백)
    if (file) {
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.error('Error deleting file after DB save failure:', unlinkError);
        }
    }
    console.error('Error creating diary:', error.message);
    res.status(500).json({ message: 'Error creating diary', error: error.message });
  }
}); 

// 2. [Read] "나의" 모든 일기 조회 (GET /)
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

    // 🌟 [추가] 파일 삭제 로직
    if (diary.imageUrl) {
        // URL에서 파일 이름만 추출
        const filename = path.basename(new URL(diary.imageUrl).pathname);
        const filePath = path.join(UPLOADS_DIR, filename);
        
        try {
            await fs.unlink(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        } catch (error) {
            // 파일이 이미 없거나 삭제에 실패해도 DB 삭제는 계속 진행
            console.error(`Error deleting file ${filePath}:`, error.message);
        }
    }

    await Diary.deleteOne({ _id: diaryId });
    res.status(200).json({ message: 'Diary deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting diary', error: error.message });
  }
});


// 6. 서버 실행
app.listen(PORT, () => {
  console.log(`Diary Service listening on port ${PORT}`);
  console.log(`Base URL is set to: ${BASE_URL}`); // 확인용 로그
});