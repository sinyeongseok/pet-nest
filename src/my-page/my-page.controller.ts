import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';
import { MyPageService } from './my-page.service';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Delete('pet/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deletePet(@Req() req, @Res() res, @Param('id') id: string) {
    const email = req.user.email;
    await this.myPageService.deletePet(id);
    const result = await this.myPageService.getPets(email);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('pet/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getPetInfo(@Req() req, @Res() res, @Param('id') id: string) {
    const result = await this.myPageService.getPetInfo(id);

    return res.status(200).json(result.data);
  }

  @Get('profile')
  @UseGuards(JwtAccessAuthGuard)
  async getUserProfile(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.myPageService.getUserProfile(email);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('profile')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  async patchUserProfile(
    @Req() req,
    @Res() res,
    @UploadedFile() file,
    @Body('nickname') nickname: string
  ) {
    const email = req.user.email;
    await this.myPageService.patchUserProfile(email, {
      nickname,
      profileImage: file,
    });
    const result = await this.myPageService.getMyPageUserInfo(email);

    return res.status(result.statusCode).json(result.data);
  }
}
