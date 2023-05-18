import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private addressService: AuthService) {}

  @Post('login')
  async login(@Res() res: Response, @Body('email') email: string) {
    const { statusCode, data } = await this.addressService.login(email);

    return res.status(statusCode).json(data);
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
