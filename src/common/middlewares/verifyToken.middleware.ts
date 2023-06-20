import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

interface TokenInterface {
  email: string;
  type: string;
  iat: number;
  exp: number;
}

@Injectable()
export class VerifyTokenMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction): any {
    const authorization: string = req.headers.authorization || '';
    if (!authorization) {
      return res.status(401).json({ message: '토큰이 존재하지 않습니다.' });
    } else {
      try {
        const data = this.jwtService.verify(req.headers.authorization);
        res.locals.email = data.email;
        next();
      } catch (error) {
        if (error.message === 'jwt expired') {
          const decodedToken: TokenInterface = this.jwtService.decode(
            req.headers.authorization
          ) as TokenInterface;
          return res.status(419).json({
            message: `만료된 ${decodedToken.type} 토큰입니다.`,
            code: 'expired',
            type: decodedToken.type,
          });
        }

        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }
    }
  }
}
