import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string) {
    console.log(email);
    return 'test';
  }
}
