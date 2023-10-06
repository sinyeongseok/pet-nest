import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';
import { MyPageService } from './my-page.service';

@Controller('my-page')
export class MyPageController {
  constructor(private myPageService: MyPageService) {}

  @Get('user-info')
  @UseGuards(JwtAccessAuthGuard)
  async getMyPageUserInfo(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.myPageService.getMyPageUserInfo(email);

    return res.status(result.statusCode).json(result.data);
  }
}
