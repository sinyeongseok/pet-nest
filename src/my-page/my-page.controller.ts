import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
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

  @Get('pets')
  @UseGuards(JwtAccessAuthGuard)
  async getPets(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.myPageService.getPets(email);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('pet')
  @UseGuards(JwtAccessAuthGuard)
  async getPet(@Req() req, @Res() res, @Query('id') id: string) {
    const result = await this.myPageService.getPet(id);

    return res.status(result.statusCode).json(result.data);
  }
}
