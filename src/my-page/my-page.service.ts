import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from 'src/schema/pet.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';
import { petType } from 'src/config/type';

@Injectable()
export class MyPageService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private userAddressModel: Model<UserAddressDocument>,
    @InjectModel(Pet.name)
    private petModel: Model<PetDocument>
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

  formatPets(pets) {
    return pets.map((pet) => {
      return {
        id: pet._id,
        name: pet.name,
        type: petType[pet.type],
        ...(!!pet.images[0] && { image: pet.images[0] }),
      };
    });
  }

  async getPets(email: string) {
    try {
      const pets = await this.petModel.find({ userEmail: email });
      const result = this.formatPets(pets);

      return { statusCode: 200, data: { pets: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
