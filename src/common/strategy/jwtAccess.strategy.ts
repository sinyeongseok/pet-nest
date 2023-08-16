import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        const authorization: string = req.headers.authorization || '';
        return authorization;
      },
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload) {
    return {
      email: payload.email,
    };
  }
}
