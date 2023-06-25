import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Express, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  async createProfile(
    @UploadedFile() file,
    @Body('email') email: string,
    @Body('nickname') nickname: string,
    @Body('petType') petType: string,
    @Body('address') address: string
  ) {
    const result = await this.userService.createProfile(file, {
      email,
      nickname,
      petType,
      address,
    });

    return { data: result };
  }

  @Post('verified/local-area')
  async verifyLocalArea(
    @Res() res,
    @Body('longitude') longitude: number,
    @Body('latitude') latitude: number
  ) {
    const email = res.locals.email;
    const result = await this.userService.verifyLocalArea(email, {
      latitude,
      longitude,
    });
    return res.status(result.statusCode).json(result.data);
  }

  @Get('random-nickname')
  async getRandomNickname() {
    const result = await this.userService.getRandomNickname();
    return { data: { randomNickname: result } };
  }
}
