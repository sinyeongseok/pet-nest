import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

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
          return res.status(401).json({ message: '만료된 토큰입니다.' });
        }

        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }
    }
  }
}
