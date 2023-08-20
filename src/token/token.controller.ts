import { Controller, Post, Res, Req, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwtRefreshAuthGuard.guard';

@Controller('token')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Post('refresh-token')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(@Res() res, @Req() req) {
    const result = await this.tokenService.refreshToken(req.user.email);
    return res.status(result.statusCode).json({ data: result.data });
  }
}
