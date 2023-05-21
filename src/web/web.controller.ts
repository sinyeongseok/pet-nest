import { Controller, Get } from '@nestjs/common';

@Controller('web')
export class WebController {
  @Get('kakao')
  setKakaoLoginRedirectURL() {
    return;
  }
}
