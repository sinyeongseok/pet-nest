import { Controller, Get } from '@nestjs/common';

@Controller('kakao')
export class KakaoController {
  @Get()
  setKakaoLoginRedirectURL() {
    return '';
  }
}
