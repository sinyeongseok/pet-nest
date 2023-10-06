import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';

@Injectable()
export class MyPageService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private userAddressModel: Model<UserAddressDocument>
  ) {}

  async getMyPageUserInfo(email: string) {
    try {
      const getUserInfo = this.userModel.findOne({ email });
      const getUserAddressInfo = this.userAddressModel.find({
        userEmail: email,
      });
      const [userInfo, userAddressInfo] = (await Promise.all([
        getUserInfo,
        getUserAddressInfo,
      ])) as [UserDocument, UserAddressDocument[]];
      const userAddress = (() => {
        if (userAddressInfo.length === 1) {
          return userAddressInfo[0].eupMyeonDong;
        }

        return userAddressInfo
          .map((userAddress) => userAddress.eupMyeonDong)
          .join(' / ');
      })();
      const result = {
        nickname: userInfo.nickname,
        address: userAddress,
        ...(!!userInfo.profileImage && { profileImage: userInfo.profileImage }),
      };

      return { statusCode: 200, data: { userInfo: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
