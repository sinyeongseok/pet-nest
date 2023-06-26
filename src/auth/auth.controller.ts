import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Res() res: Response, @Body('email') email: string) {
    const { statusCode, data } = await this.authService.login(email);

    return res.status(statusCode).json(data);
  }

  @Post('nickname')
  async validateNickname(
    @Res() res: Response,
    @Body('nickname') nickname: string
  ) {
    const { statusCode, data } = await this.authService.validateNickname(
      nickname
    );

    return res.status(statusCode).json({ message: data });
  }

  @Post('local-area')
  async verifyLocalArea(
    @Res() res,
    @Body('longitude') longitude: number,
    @Body('latitude') latitude: number
  ) {
    const email = res.locals.email;
    const result = await this.authService.verifyLocalArea(email, {
      latitude,
      longitude,
    });
    return res.status(result.statusCode).json(result.data);
  }
}
