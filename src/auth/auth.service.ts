import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { UserAddress, UserAddressDocument } from '../schema/userAddress.schema';
import { TokenService } from '../token/token.service';
import { UtilService } from 'src/utils/util.service';
import {
  CityAddress,
  CityAddressDocument,
} from 'src/schema/cityAddress.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    @InjectModel(CityAddress.name)
    private CityAddressModel: Model<CityAddressDocument>,
    private tokenService: TokenService,
    private utilService: UtilService
  ) {}

  formatForLogin(user: UserDocument, userAddress: UserAddressDocument) {
    return {
      email: user.email,
      nickname: user.nickname,
      petType: user.petType,
      address: userAddress.eupMyeonDong,
      ...(!!user.profileImage && { profileImage: user.profileImage }),
    };
  }

  async login(email: string) {
    try {
      const user = await this.UserModel.findOne({ email });

      if (!user) {
        return { statusCode: 202, data: { isNewby: true } };
      }

      const accessToken = this.tokenService.generateAccessToken(email);
      const refreshToken = this.tokenService.generateRefreshToken(email);
      const userAddress = await this.utilService.getUserRecentAddress(email);
      const formattedLoginData = this.formatForLogin(user, userAddress);

      return {
        statusCode: 200,
        data: { data: { ...formattedLoginData, accessToken, refreshToken } },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateNickname(nickname: string) {
    const regex = /^[ㄱ-ㅎ가-힣a-zA-Z0-9]+$/;

    if (!nickname.length) {
      throw new HttpException('닉네임을 입력해주세요.', HttpStatus.BAD_REQUEST);
    }

    if (nickname.length < 2) {
      throw new HttpException(
        '두글자 이상 작성해주세요.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (nickname.length > 10) {
      throw new HttpException(
        '닉네임은 10자까지만 가능해요.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!regex.test(nickname)) {
      throw new HttpException(
        '닉네임은 띄어쓰기 없이 한글, 영문, 숫자만 가능해요.',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const findNickname = await this.UserModel.findOne({
        nickname,
      });

      if (!!findNickname) {
        throw new HttpException(
          '닉네임이 이미 존재해요.',
          HttpStatus.BAD_REQUEST
        );
      }

      return { statusCode: 200, data: '사용 가능한 닉네임이에요.' };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkLocalArea(email: string) {
    try {
      const userAddress = await this.utilService.getUserRecentAddress(email);

      if (userAddress.isAuth) {
        return { statusCode: 200, data: { isVerified: true } };
      }

      return { statusCode: 400, data: { isVerified: false } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyLocalArea(
    email: string,
    { latitude, longitude }: { latitude: number; longitude: number }
  ) {
    try {
      const userAddress = await this.utilService.getUserRecentAddress(email);
      const findAddress = await this.CityAddressModel.aggregate([
        {
          $geoNear: {
            maxDistance: 2000,
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            query: { detail: userAddress.detail },
            distanceField: 'distance',
            key: 'location',
          },
        },
      ]);

      if (!findAddress.length) {
        throw new HttpException(
          '인증 지역을 확인해주세요.',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.UserAddressModel.updateOne(
        { _id: userAddress._id },
        {
          isAuth: true,
        }
      );

      return {
        statusCode: 200,
        data: { verifiedLocalArea: userAddress.eupMyeonDong },
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
