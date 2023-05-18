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
  createProfile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    console.log(file);
    console.log(body);
  }
}
