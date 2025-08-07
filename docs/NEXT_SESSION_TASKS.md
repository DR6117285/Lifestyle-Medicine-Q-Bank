# Next Session Priority Tasks

## 🎯 Immediate Tasks (High Priority)

### 1. Question Data Import 📋
**Status**: Ready to implement
**Location**: `/home/dr6117285/lmqb/data/questions/`
**Goal**: Import existing JSON question files into Supabase database

**Tasks**:
- [ ] Locate original question JSON files (they were in `/home/dr6117285/data/` originally)
- [ ] Create import script (`scripts/import-questions.js`)
- [ ] Parse question JSON structure and validate
- [ ] Map questions to database schema (categories/sections/questions tables)
- [ ] Execute import and verify data integrity
- [ ] Create admin UI for bulk import in future

**Expected Files to Process**:
```
- General - 1. Introduction to Lifestyle Medicine.json
- General - 2. Fundamentals of Health Behavior Change.json
- ... (multiple sections)
- From Board Review Notes - [sections].json
- Study-Tool Based - [sections].json
```

### 2. Quiz Engine Implementation 🎮
**Status**: UI complete, backend logic needed
**Components**: Already have `QuizPage.tsx` UI
**Goal**: Implement actual quiz functionality

**Tasks**:
- [ ] Create quiz state management (Zustand store)
- [ ] Implement question selection algorithms:
  - Random mode: Select N random questions
  - Section mode: Select questions from specific section
  - Timed mode: Select questions with timer functionality
- [ ] Create quiz session management (start/pause/complete)
- [ ] Implement answer validation and scoring
- [ ] Add instant feedback display with rationales
- [ ] Connect to database for session persistence

### 3. Statistics Connection 📊
**Status**: UI complete, need real data connection
**Goal**: Connect Statistics page to actual user data

**Tasks**:
- [ ] Create statistics calculation functions
- [ ] Connect to user_statistics materialized view
- [ ] Implement real-time progress tracking
- [ ] Add section-wise performance analytics

## 🔧 Development Setup Reminder

**Current Project State**:
- ✅ Frontend: Complete with all pages and authentication
- ✅ Backend: Database schema and Supabase config ready
- ✅ Authentication: Full login/signup/protected routes working
- ⏳ Data: Need to import questions
- ⏳ Quiz Logic: Need to implement quiz engine

**To Continue Development**:
1. Navigate to: `cd /home/dr6117285/lmqb`
2. Check git status: `git status`
3. Review project structure: `cat docs/PROJECT_STRUCTURE.md`
4. Start with question import as highest priority

## 📝 Code Patterns to Follow

### Import Script Pattern
```javascript
// scripts/import-questions.js
const { supabase } = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

// Read JSON files from data/questions/
// Parse and validate structure
// Insert into categories -> sections -> questions
// Preserve original JSON in original_json field
```

### Quiz Store Pattern
```typescript
// stores/quizStore.ts
interface QuizState {
  currentSession: QuizSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: QuizAttempt[];
  timeRemaining?: number;
}
```

### Statistics Calculation Pattern
```sql
-- Real user statistics queries
SELECT 
  user_id,
  COUNT(*) as total_questions,
  AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy,
  AVG(time_taken) as avg_time
FROM quiz_attempts qa
JOIN quiz_sessions qs ON qa.session_id = qs.id
WHERE qs.user_id = $1
GROUP BY user_id;
```

## 🎯 Success Criteria

### Question Import Success
- [ ] All JSON files successfully parsed
- [ ] Questions appear in database with proper relationships
- [ ] Original JSON structure preserved
- [ ] Categories and sections properly mapped
- [ ] No data loss or corruption

### Quiz Engine Success  
- [ ] Users can start quiz in any mode (random/section/timed)
- [ ] Questions display correctly with options
- [ ] Answer selection and validation works
- [ ] Instant feedback shows rationale
- [ ] Quiz results calculate and save correctly
- [ ] Session persistence works across page refreshes

### Statistics Success
- [ ] Real user data displays in statistics page
- [ ] Performance calculations are accurate
- [ ] Section breakdown shows real progress
- [ ] Recommendations based on actual performance

## 🚨 Important Notes

### Data Location
The original question files were located at `/home/dr6117285/data/` before we started the project. They need to be moved/copied to the project structure at `/home/dr6117285/lmqb/data/questions/`.

### Database Connection
The frontend is configured to connect to Supabase at `http://localhost:8000` with the client configuration in `frontend/src/utils/supabaseClient.ts`.

### Development Flow
1. **Import questions first** - This unblocks all quiz functionality
2. **Implement quiz engine** - Core functionality for the application
3. **Connect statistics** - Complete the user experience
4. **Add admin tools** - Question management capabilities

### Agent Usage Recommendations
- Use `CodeGenerator_Implementer_v1.3` for implementing quiz logic
- Use `TestEngineer_Validator_v1.1` for testing quiz functionality
- Use `DocumentationScribe_Writer_v1.2` for updating API docs as needed

The project is in excellent shape and ready for these final implementation steps to become a fully functional medical education platform.