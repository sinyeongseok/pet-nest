import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  generateAccessToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  generateRefreshToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  async login(email: string) {
    try {
      const user = await this.UserModel.findOne({ email });

      if (!user) {
        return { statusCode: 202, data: { isNewby: true } };
      }

      const accessToken = this.generateAccessToken(email);
      const refreshToken = this.generateRefreshToken(email);

      return {
        statusCode: 200,
        data: { data: user, accessToken, refreshToken },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: '서버 요청 실패.' };
    }
  }

  async validateNickname(nickname: string) {
    const regex = /^[ㄱ-ㅎ가-힣a-zA-Z0-9]+$/;

    if (nickname.length < 2) {
      return { statusCode: 400, data: '두글자 이상 작성해주세요.' };
    }

    if (nickname.length > 10) {
      return { statusCode: 400, data: '닉네임은 10자까지만 가능해요.' };
    }

    if (!regex.test(nickname)) {
      return {
        statusCode: 400,
        data: '닉네임은 띄어쓰기 없이 한글, 영문, 숫자만 가능해요.',
      };
    }

    try {
      const findNickname = await this.UserModel.findOne({
        nickname,
      });

      if (!!findNickname) {
        return { statusCode: 400, data: '닉네임이 이미 존재해요.' };
      }

      return { statusCode: 200, data: '사용 가능한 닉네임이에요.' };
    } catch (error) {
      return { statusCode: 500, data: '서버 요청 실패.' };
    }
  }
}
