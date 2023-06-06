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
  constructor(private addressService: UserService) {}

  @Post('profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  createProfile(@UploadedFile() file, @Body() body) {
    const result = this.addressService.createProfile(file, body);

    return result;
  }

  @Get('random-nickname')
  async getRandomNickname() {
    const result = await this.addressService.getRandomNickname();
    return { data: { randomNickname: result } };
  }
}
