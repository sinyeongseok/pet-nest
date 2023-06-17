import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  generateRefreshToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }
}
