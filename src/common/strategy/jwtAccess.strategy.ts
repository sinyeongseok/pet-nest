import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        if (req?.handshake?.query?.token) {
          return req.handshake.query.token || '';
        }

        const authorization: string = req.headers.authorization || '';
        return authorization;
      },
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload) {
    return payload;
  }
}
