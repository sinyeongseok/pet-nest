import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { stat } from 'fs';

@Controller('auth')
export class AuthController {
  constructor(private addressService: AuthService) {}

  @Post('login')
  login(@Body('email') email: string) {
    return this.addressService.login(email);
  }

  @Post('nickname')
  async validateNickname(
    @Res() res: Response,
    @Body('nickname') nickname: string
  ) {
    const { statusCode, data } = await this.addressService.validateNickname(
      nickname
    );

    return res.status(statusCode).json({ message: data });
  }
}
