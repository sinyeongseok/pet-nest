import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
  Param,
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

  @Get('addresses')
  async getUserAddresses(@Res() res) {
    const email = res.locals.email;
    const result = await this.userService.getUserAddresses(email, null);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('addresses/settings')
  async getUserAddressesSettings(@Res() res) {
    const email = res.locals.email;
    const result = await this.userService.getUserAddresses(email, 'settings');

    return res.status(result.statusCode).json(result.data);
  }

  @Get('random-nickname')
  async getRandomNickname() {
    const result = await this.userService.getRandomNickname();
    return { data: { randomNickname: result } };
  }
}
