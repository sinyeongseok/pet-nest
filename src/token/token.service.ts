import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schema/user.schema';
import { UserAddress, UserAddressDocument } from '../schema/userAddress.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>
  ) {}

  generateAccessToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  generateRefreshToken(email: string): string {
    const payload = { email };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  async refreshToken(email: string) {
    try {
      const userInfo = await this.UserModel.findOne({ email });
      const userAddressInfo = await this.UserAddressModel.findOne({
        userEmail: email,
        isLastSelected: true,
      });
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
