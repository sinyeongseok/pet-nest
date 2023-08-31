import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilService } from 'src/utils/util.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    private utilService: UtilService
  ) {}

  generateAccessToken(email: string): string {
    const payload = { email, type: 'access' };
    return this.jwtService.sign(payload, { expiresIn: '10s' });
  }

  generateRefreshToken(email: string): string {
    const payload = { email, type: 'refresh' };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  async validateToken(token: string) {
    try {
      const decodedToken = this.jwtService.verify(token);
      if (decodedToken) {
        return { statusCode: 200, message: '유효한 토큰', user: decodedToken };
      }
    } catch (error) {
      const tokenInfo = await this.jwtService.decode(token);

      if (typeof tokenInfo === 'object' && 'email' in tokenInfo) {
        if (error?.message === 'jwt expired') {
          const refreshToken = this.generateRefreshToken(tokenInfo.email);
          return { statusCode: 419, message: 'jwt expired', refreshToken };
        }
      }

      return { statusCode: 401, message: '유효하지 않은 토큰' };
    }
  }

  async refreshToken(email: string) {
    try {
      const userInfo = await this.UserModel.findOne({ email });
      const userAddressInfo = await this.utilService.getUserRecentAddress(
        email
      );
      const accessToken = this.generateAccessToken(email);
      const result = {
        email,
        accessToken,
        nickname: userInfo.nickname,
        petType: userInfo.petType,
        address: userAddressInfo.eupMyeonDong,
        profileImage: userInfo.profileImage,
      };
      return { statusCode: 200, data: result };
    } catch (error) {
      return {
        statusCode: 404,
        data: { message: '가입되지 않은 회원입니다.' },
      };
    }
  }
}
