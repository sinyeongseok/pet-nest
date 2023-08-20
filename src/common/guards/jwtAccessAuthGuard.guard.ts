import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard('access') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info: Error) {
    if (err || !user) {
      if (info.name == 'TokenExpiredError') {
        throw new HttpException(
          {
            message: '만료된 access 토큰입니다.',
            code: 'expired',
            type: 'access',
          },
          419
        );
      }

      throw new HttpException(
        {
          message: '유효하지 않은 토큰입니다.',
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    return user;
  }
}
