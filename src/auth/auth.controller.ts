import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private addressService: AuthService) {}

  @Post('login')
  login(@Body('email') email: string) {
    return this.addressService.login(email);
  }
}
