## 📃 프로젝트 목적

- 사이드 프로젝트 (4명)
- 반려인을 위한 당근마켓과 산책메이트 구하기

## 💻 사용한 기술, 모듈, 외부 리소스

#### 주 기술

<img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">
<img src="https://img.shields.io/badge/mongodb-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/amazons3-569A31?style=for-the-badge&logo=amazons3&logoColor=white">

#### 모듈, 외부 리소스

- typescript
- mongoose
- @nestjs/websockets, socket.io
- aws-sdk
- passport, passport-jwt
- dayjs
- multer, multer-s3
- uuid

## 📂 프로젝트 폴더 구조

```
📦src
 ┣ 📂address
 ┃ ┣ 📜address.controller.ts
 ┃ ┣ 📜address.model.ts
 ┃ ┣ 📜address.module.ts
 ┃ ┗ 📜address.service.ts
 ┣ 📂auth
 ┃ ┣ 📜auth.controller.ts
 ┃ ┣ 📜auth.module.ts
 ┃ ┗ 📜auth.service.ts
 ┣ 📂board
 ┃ ┣ 📜board.controller.ts
 ┃ ┣ 📜board.module.ts
 ┃ ┣ 📜petMateBoard.service.ts
 ┃ ┗ 📜usedItemBoard.service.ts
 ┣ 📂chat
 ┃ ┣ 📜chat.controller.ts
 ┃ ┣ 📜chat.gateway.ts
 ┃ ┣ 📜chat.module.ts
 ┃ ┗ 📜chat.service.ts
 ┣ 📂common
 ┃ ┣ 📂guards
 ┃ ┃ ┣ 📜jwtAccessAuthGuard.guard.ts
 ┃ ┃ ┗ 📜jwtRefreshAuthGuard.guard.ts
 ┃ ┣ 📂strategy
 ┃ ┃ ┣ 📜jwtAccess.strategy.ts
 ┃ ┃ ┗ 📜jwtRefresh.strategy.ts
 ┃ ┗ 📜common.module.ts
 ┣ 📂config
 ┃ ┣ 📂constants
 ┃ ┃ ┣ 📂dist
 ┃ ┃ ┃ ┗ 📜index.js
 ┃ ┃ ┗ 📜index.ts
 ┃ ┗ 📂type
 ┃ ┃ ┣ 📂dist
 ┃ ┃ ┃ ┗ 📜index.js
 ┃ ┃ ┗ 📜index.ts
 ┣ 📂my-page
 ┃ ┣ 📜my-page.controller.ts
 ┃ ┣ 📜my-page.module.ts
 ┃ ┗ 📜my-page.service.ts
 ┣ 📂schema
 ┃ ┣ 📜ParticipatingList.schema.ts
 ┃ ┣ 📜blockedUserSchema.schema.ts
 ┃ ┣ 📜chatRoom.schema.ts
 ┃ ┣ 📜chatRoomSetting.schema.ts
 ┃ ┣ 📜cityAddress.schema.ts
 ┃ ┣ 📜message.schema.ts
 ┃ ┣ 📜pet.schema.ts
 ┃ ┣ 📜petMateBoardSchema.schema.ts
 ┃ ┣ 📜usedItemBoard.schema.ts
 ┃ ┣ 📜usedItemSchedule.schema.ts
 ┃ ┣ 📜user.schema.ts
 ┃ ┗ 📜userAddress.schema.ts
 ┣ 📂token
 ┃ ┣ 📜token.controller.ts
 ┃ ┣ 📜token.module.ts
 ┃ ┗ 📜token.service.ts
 ┣ 📂user
 ┃ ┣ 📜user.controller.ts
 ┃ ┣ 📜user.module.ts
 ┃ ┗ 📜user.service.ts
 ┣ 📂utils
 ┃ ┣ 📂plugin
 ┃ ┃ ┗ 📜dayjsPlugin.ts
 ┃ ┣ 📜s3.ts
 ┃ ┗ 📜util.service.ts
 ┣ 📂web
 ┃ ┣ 📜web.controller.ts
 ┃ ┗ 📜web.module.ts
 ┣ 📜app.module.ts
 ┗ 📜main.ts
```

## 📸 프로젝트 사진

![온보딩](https://github.com/sinyeongseok/pet-nest/assets/80402309/4bed8099-c8dc-4b1b-83bf-5247ef9eaff8)

--

![동네선택1](https://github.com/sinyeongseok/pet-nest/assets/80402309/8bf9fe80-0ba0-4d85-8478-06becec51c14)
![동네선택2](https://github.com/sinyeongseok/pet-nest/assets/80402309/a0390dda-d76d-4fd8-a7f9-470b272bd642)

--

![중고거래](https://github.com/sinyeongseok/pet-nest/assets/80402309/1515d91b-4d0b-4dc2-a281-80de2928b4e0)

--

![마이페이지](https://github.com/sinyeongseok/pet-nest/assets/80402309/708f2c03-847c-4878-92a9-4f5a2ddabc7b)
