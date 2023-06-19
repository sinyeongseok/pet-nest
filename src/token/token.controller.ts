import { Controller, Post, Res } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Post('refresh-token')
  async refreshToken(@Res() res) {
    const result = await this.tokenService.refreshToken(res.locals.email);
    return res.status(result.statusCode).json({ data: result.data });
  }
}
