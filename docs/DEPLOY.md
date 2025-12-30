# 배포 가이드

이 문서는 Vercel에 배포하는 방법을 설명합니다.

## 환경 변수 설정

### 필수 환경 변수

없음. 모든 기능은 키 없이도 동작합니다.

### 선택 환경 변수

다음 환경 변수는 선택사항이며, 설정하지 않아도 빌드/실행이 가능합니다:

- `NEXT_PUBLIC_SITE_URL`: 사이트의 절대 URL (예: `https://yourdomain.com`)
  - 설정하지 않으면 `SITE_CONFIG.url` 또는 `http://localhost:3000`을 사용
  - RSS, OG 이미지 등에서 사용

### 기타 환경 변수 (차단된 기능용)

다음 기능들은 현재 차단되어 있지만, 나중에 활성화할 경우 필요한 변수들:

- `POSTMARK_CLIENT_ID`: 이메일 발송용 (HN digest 등)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: 구독 관리용
- `JWT_SIGNING_KEY`: JWT 토큰 서명용
- `NOTION_TOKEN`, `NOTION_*_DATABASE_ID`: Notion 연동용

## Vercel 배포

### 1. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택

### 2. 환경 변수 설정

Vercel 프로젝트 설정에서:

1. Settings → Environment Variables로 이동
2. `NEXT_PUBLIC_SITE_URL` 추가 (예: `https://yourdomain.com`)

### 3. 빌드 설정

기본 설정으로 빌드가 가능합니다:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

### 4. 배포

GitHub에 push하면 자동으로 배포됩니다.

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 빌드 검증

배포 전에 다음을 확인하세요:

- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 모든 글의 frontmatter가 올바른 형식
- [ ] slug 충돌 없음
- [ ] RSS 피드가 정상 작동 (`/writing/rss.xml`)

