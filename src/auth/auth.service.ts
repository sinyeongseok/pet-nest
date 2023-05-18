import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {}

  async login(email: string) {
    try {
      const user = await this.UserModel.findOne({ email });

      if (!user) {
        return { statusCode: 202, data: { isNewby: true } };
      }

      return { statusCode: 200, data: { data: user } };
    } catch (error) {
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

      return { statusCode: 200, data: process.env.MONGODB_URL };
    } catch (error) {
      return { statusCode: 500, data: '서버 요청 실패.' };
    }
  }
}
