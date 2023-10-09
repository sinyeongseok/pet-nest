import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';
import { MyPageService } from './my-page.service';
import { FilesInterceptor } from '@nestjs/platform-express';

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

  @Post('pet')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('petImages', 5))
  async createPet(
    @Res() res,
    @Req() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() petInfo
  ) {
    const email = req.user.email;
    const result = await this.myPageService.createPet(email, files, petInfo);

    return res.status(result.statusCode).json(result.data);
  }
}
