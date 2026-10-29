# 꼬불고양이 디자인 테스트

기존 meow0930와 별도로 배포하는 정적 디자인 시제품입니다.

- 아기자기한 흑백 방과 투명 클릭 영역
- 마우스 시선 추적, 얼굴 호버 시 깜빡임, 소품 호버 반응
- 사용자 기기 시간 기준 06:00~18:00 낮 / 나머지 밤
- 예시 타로와 캣닢 답변, 브라우저 기록 저장
- 실제 엔진·계정·결제 연결 없음

## Vercel CLI로 배포

압축을 풀고 이 폴더를 VS Code로 열어 터미널에서 실행:

```powershell
npx.cmd vercel@latest login
npx.cmd vercel@latest
```

새 프로젝트를 선택하고 이름은 `curly-cat-design-test`로 설정하세요.
기존 프로젝트 연결 질문에는 No를 선택하세요.
배포할 디렉터리는 현재 디렉터리 `.` 입니다.
설정 파일에서 정적 파일 폴더 `public`을 지정했습니다.
로그인은 본인의 Vercel 계정에서 완료하세요. 토큰을 채팅에 보내지 마세요.

## GitHub로 연결

새 저장소에 프로젝트 전체를 올린 뒤 Vercel New Project에서 가져옵니다.
Framework: Other / Output Directory: public / Build Command: 없음.

## 로컬 확인

```powershell
python -m http.server 8000 --directory public
```

http://localhost:8000 에 접속하세요.

## 검증 범위

JavaScript 문법, 정적 파일 참조, 낮/밤 경계 검사 통과.
실제 Vercel 배포와 브라우저 시각 검증은 미완료입니다.
