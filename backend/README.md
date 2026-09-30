# 이메일 회원 기능 — 연결 및 검증

기존 HTML/CSS/JS + Node.js Express + Supabase Auth + PostgreSQL 서버 세션입니다.
**외부 설정이 없으면 회원 기능은 비활성화됩니다.** 테스트 대역을 실제 서비스에 사용하지 않습니다.
Supabase `auth.users.id` UUID가 회원 ID이며 로그인·로그아웃·새로고침으로 바뀌지 않습니다.
내 기록장은 회원만 접근 가능한 빈 화면입니다. 질문·답변 저장·삭제는 이번 범위가 아닙니다.

## 외부에서 준비할 설정

1. Supabase 계정·프로젝트를 준비합니다. 요금과 지역을 선택합니다.
2. Authentication → Providers에서 Email 및 **Confirm email을 켭니다**. Google은 켜지 않습니다. 비밀번호 최소 길이는 12자 이상을 권합니다. 앱 가입은 영문·숫자 포함 12~128자를 요구합니다.
3. URL Configuration의 Site URL과 Redirect URL에 `http://127.0.0.1:5173`을 설정합니다. `localhost`와 혼용하지 마세요.
4. Email Templates → Confirm signup의 확인 링크를 다음처럼 바꿉니다.

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}">이메일 확인 / Confirm email</a>
```

확인 링크는 이메일 소유권만 확인하며 자동 로그인하지 않습니다. 이후 사이트에서 로그인합니다. 로컬 링크는 이 PC의 브라우저에서 여세요.

5. 일반 회원용 발송에는 Custom SMTP에 발송 서비스의 host, port, 사용자, 비밀번호, 발신 주소를 설정합니다. 발신 도메인 인증도 필요할 수 있습니다. 기본 Supabase SMTP는 팀 주소와 소량 테스트용입니다.
6. Supabase SQL Editor에서 `backend/schema.sql`을 실행합니다. **private 스키마를 Data API에 노출하지 마세요.**
7. 프로젝트 Connect에서 PostgreSQL **session pooler** URL을 가져옵니다. DB 비밀번호의 특수문자는 URL 인코딩하고 제공된 TLS 설정을 유지하세요. 인증서 검증을 끄는 설정은 사용하지 않습니다.
8. 프로젝트 URL과 publishable key(또는 legacy anon key)를 확인합니다. secret/service_role 관리자 키는 필요하지 않습니다.

위 서비스 설정과 SQL 실행은 아직 수행하지 않았습니다. Free 한도 안에서 시작할 수 있지만 유료 플랜·추가 리소스·메일·호스팅·도메인은 비용이 생길 수 있습니다.

## Windows cmd 실행

```cmd
cd /d C:\Users\hka11\Desktop\meow0930
npm ci
copy .env.example .env
node -e "const fs=require('node:fs');const p='.env';const s=fs.readFileSync(p,'utf8');if(!/^SESSION_SECRET=[ \t]*$/m.test(s))throw Error('SESSION_SECRET must be empty');fs.writeFileSync(p,s.replace(/^SESSION_SECRET=[ \t]*$/m,'SESSION_SECRET='+require('node:crypto').randomBytes(48).toString('base64url')));"
notepad .env
```

위 명령은 무작위 SESSION_SECRET을 화면에 출력하지 않고 로컬 .env에 직접 저장합니다. 기존 값이 있으면 덮어쓰지 않습니다. 나머지 값은 .env에 직접 입력하세요. .env는 Git 제외 대상입니다. 키·DB 비밀번호·세션 비밀값은 채팅이나 frontend에 넣지 마세요. 이미 .env가 있으면 copy 명령으로 덮어쓰지 마세요.

| 변수명 | 로컬에 입력할 값 / 찾는 위치 |
|---|---|
| APP_ORIGIN | 로컬 사이트 주소 `http://127.0.0.1:5173` (끝에 / 없음) |
| PORT | `5173` |
| NODE_ENV | `development` |
| SUPABASE_URL | 프로젝트 Connect의 API 연결 안내에 표시된 Project URL |
| SUPABASE_PUBLISHABLE_KEY | Settings → API Keys의 publishable key. secret/service_role 아님 |
| DATABASE_URL | Connect → Connection string → Session pooler의 URI. 실제 DB 비밀번호는 로컬에서만 입력 |
| SESSION_SECRET | 위 명령이 로컬에서 생성·저장하는 무작위 값 |

DB 설정 파일은 `backend/schema.sql` 하나입니다. 프로젝트 생성 후 SQL Editor에서 파일 전체를 한 번 실행하고 성공을 확인한 뒤 서버를 시작합니다. 이 파일 안에서 스키마 → 테이블 → 인덱스 → RLS/권한 순서로 실행되므로 나누어 실행하지 않습니다. 별도의 회원 테이블 마이그레이션은 없고 Supabase Auth가 회원을 관리합니다.

```cmd
npm run dev
```

`http://127.0.0.1:5173`을 엽니다. 기존 서버가 실행 중이면 그 터미널에서 Ctrl+C로 먼저 종료합니다. .env 수정 후 서버를 다시 시작합니다.
설정이 비어 있으면 방·타로는 열리지만 회원 API는 `503 authNotConfigured`를 반환합니다.
설정이 있으나 DB/세션 테이블 접속이 실패하면 서버는 시작하지 않습니다. 서버는 현재 로컬 PC에만 바인딩합니다.
`npm run preview`는 기존 정적 미리보기이며 회원 API가 없습니다. 회원 검증은 `npm run dev`를 사용합니다.

## 검증

```cmd
npm test
npm run test:live
```

`npm test`는 기존 5개 언어·180개 해석과 HTTP 보안 검사를 실행합니다. 서버 테스트는 테스트 파일에만 정의된 provider double과 MemoryStore를 사용합니다. 실제 Supabase·메일·PostgreSQL 검증은 아닙니다.
`test:live`는 두 테스트 계정 설정이 없으면 **NOT RUN**을 출력합니다.

실제 서비스 연결 후:

1. 서로 다른 수신 가능한 이메일 2개로 화면에서 가입합니다. 안내 후에도 로그아웃 상태인지 확인합니다. 미확인 이메일 로그인은 거절되어야 합니다.
2. 두 메일의 확인 링크를 누릅니다. 브라우저와 시크릿 창에서 각 계정에 로그인합니다. 회원에게만 내 기록장 메뉴와 빈 화면이 보여야 합니다.
3. 새로고침 유지, 잘못된 비밀번호 오류를 확인합니다.
4. 서버를 Ctrl+C로 종료하고 다시 `npm run dev`를 실행합니다. 같은 창에서 새로고침해 PostgreSQL 세션이 유지되는지 확인합니다.
5. 한 계정을 로그아웃하고 새로고침합니다. 내 기록장이 숨겨지고 다른 창은 로그인 상태를 유지해야 합니다.
6. 로컬 `.env.test`에 아래 값을 설정하고 서버가 실행 중일 때 `npm run test:live`를 실행합니다. 이미 가입·이메일 확인된 테스트 전용 계정만 사용하세요.

```text
TEST_ORIGIN=http://127.0.0.1:5173
TEST_ACCOUNT_A_EMAIL=테스트 이메일 A
TEST_ACCOUNT_A_PASSWORD=테스트 비밀번호 A
TEST_ACCOUNT_B_EMAIL=테스트 이메일 B
TEST_ACCOUNT_B_PASSWORD=테스트 비밀번호 B
```

.env.test도 Git 제외 대상입니다. live 검사는 두 계정 로그인·틀린 비밀번호·쿠키를 유지한 새 요청·고정 ID·본인 전용 접근·로그아웃·쿠키 재사용 차단을 확인하며 종료 시 테스트 세션을 로그아웃합니다. 가입 메일 도착과 서버 재시작은 위 수동 검사로 검증합니다.

## 보호 방식과 제한

- 비밀번호는 Supabase Auth에 전달하고 앱 파일·세션·DB에 저장하지 않습니다. 비밀번호 해싱은 Supabase가 담당합니다.
- 인증 토큰은 PostgreSQL private 서버 세션에 저장합니다. 브라우저에는 서명된 불투명 세션 ID만 HttpOnly/SameSite=Lax 쿠키로 전달합니다. 운영 HTTPS에서는 Secure 및 __Host- 이름을 적용합니다.
- 로그인 때 세션 ID·CSRF 토큰을 교체합니다. 회원 API마다 Supabase getUser로 신원을 확인하며 만료 임박 토큰은 서버에서 갱신합니다.
- 같은 세션의 요청은 현재 한 프로세스에서 순서대로 처리해 갱신 요청이 로그아웃 세션을 되살리지 못하게 합니다. 다중 인스턴스 전환 시에는 이 직렬화도 공유 저장소 기반으로 바꿔야 합니다.
- 로그아웃은 서버 세션 파기와 쿠키 삭제를 수행합니다. 인증 서비스 장애 시 로컬 로그아웃과 원격 폐기 미확인을 구분해 안내합니다.
- POST는 정확한 Origin, JSON, 세션에 연결된 CSRF 토큰을 요구합니다. 입력 형식·길이·추가 필드·4KB 요청 크기를 검증합니다.
- 15분당 IP별 가입 5회/로그인 15회, 이메일별 합계 10회, 전체 API IP별 240회로 제한합니다. 429 및 Retry-After를 반환합니다.
- 제한 카운터는 현재 **한 Node 프로세스의 메모리**이며 재시작 시 초기화됩니다. Supabase 자체 제한도 적용됩니다. 공개 배포/다중 인스턴스 전에는 공유 limiter 저장소·프록시 IP·HTTPS 설정 검증이 필요합니다. 현재 trust proxy=false이며 외부 배포는 하지 않았습니다.
- 쿠키 기간은 7일입니다. 만료 세션 행은 주기적으로 정리합니다. SESSION_SECRET 변경 시 기존 쿠키는 무효가 됩니다. DB 접속 정보는 서버 비밀정보입니다.
- 회원 API는 본인 정보만 반환합니다. 기록장 API는 userId를 받지 않습니다. 다른 회원 조회 API는 없습니다.
- 5개 언어에 회원 문구·오류 안내를 추가했습니다. 기존 이미지·방 CSS·눈동자·타로는 유지합니다. AI·광고·결제·Google·비밀번호 재설정 UI는 이번 범위에 없습니다.

공식 문서: [이메일 인증](https://supabase.com/docs/guides/auth/passwords), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [요금](https://supabase.com/pricing), [getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [Express 보안](https://expressjs.com/en/advanced/best-practice-security/).
