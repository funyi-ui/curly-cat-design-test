# 회원 기능 검증 상태

2026-09-30, `feature/member-auth`.

## 확인한 결과

- 시작점: master `45bd1d0 Save initial cat fortune website`, 작업 폴더 clean.
- 기존 cat.png, room.png, style.css, i18n.js 변경 없음. 기존 app.js에는 회원 UI의 언어 변경 알림 1줄만 추가.
- `npm test` 통과: 기존 5개 언어/180개 해석 검사 및 서버·회원 UI 테스트 13개.
- 서버 테스트에서 테스트 대역 두 계정의 가입, 로그인, 로그아웃, 틀린 비밀번호, 쿠키를 유지한 새 요청, 고정 ID, 본인 전용 접근을 확인.
- CSRF/Origin, 요청 크기·입력 형식, IP/이메일 시도 제한, 쿠키 위조, 로그아웃 쿠키 재사용, 갱신·로그아웃 동시 요청, 인증 장애와 미설정 상태를 검사.
- 서버를 미설정 상태로 로컬 실행해 디자인 정적 파일 제공 및 회원 비활성 안내를 확인.
- npm 의존성 설치 시 audit 결과 취약점 0건.
- `git diff --check` 통과. .env/.env.test/node_modules 제외 확인. 실제 키·비밀번호 파일은 생성하지 않음.

## 아직 확인하지 못한 결과

- Supabase 프로젝트·DB·SMTP 설정이 없어 실제 서비스 로그인과 메일 발송 검증은 미실행.
- `npm run test:live`: NOT RUN — 실제 확인된 두 테스트 계정 정보가 없음.
- PostgreSQL 세션의 서버 재시작 후 유지, 실제 이메일 확인·만료, 공급자 토큰의 실 갱신은 연결 후 검사 필요.
- 연결된 자동화 브라우저가 없어 실제 렌더링·PC/모바일 레이아웃·눈동자 움직임 육안 검사는 미실행. UI 검사는 가벼운 DOM 모형 기준.

연결 절차와 Windows cmd 명령은 `backend/README.md`를 참고하세요.
외부 가입·SQL 실행·업로드·배포, AI·광고·결제 연결은 수행하지 않았습니다.
