import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { UserAddress, UserAddressDocument } from '../schema/userAddress.schema';
import { CityAddress, CityAddressDocument } from '../schema/cityAddress.schema';
import { de, fakerKO as faker } from '@faker-js/faker';
import { adjective } from './adjective';
import { AwsService } from '../utils/s3';
import { TokenService } from 'src/token/token.service';
import { UtilService } from 'src/utils/util.service';
import {
  BlockedUser,
  BlockedUserDocument,
} from 'src/schema/blockedUserSchema.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    @InjectModel(CityAddress.name)
    private CityAddressModel: Model<CityAddressDocument>,
    @InjectModel(BlockedUser.name)
    private blockedUserModel: Model<BlockedUserDocument>,
    private awsService: AwsService,
    private tokenService: TokenService,
    private utilService: UtilService
  ) {}

  async createProfile(file, { email, nickname, petType, address }) {
    const profileImage = await (async () => {
      if (!!file) {
        const result = await this.awsService.uploadFileToS3(
          `profileImages/${email}/${email}.jpeg`,
          file
        );

        return result.url;
      }

      return undefined;
    })();
    const userAddress = JSON.parse(address);
    const addressInfo = await this.CityAddressModel.findOne({
      detail: userAddress.detail,
    });
    const accessToken = this.tokenService.generateAccessToken(email);
    const refreshToken = this.tokenService.generateRefreshToken(email);
    const createUser = new this.UserModel({
      email,
      nickname,
      petType: petType,
      ...(!!profileImage && { profileImage }),
    });
    const neighborhoodRegistration = new this.UserAddressModel({
      userEmail: email,
      isLastSelected: true,
      isAuth: false,
      siDo: addressInfo.siDo,
      siGunGu: addressInfo.siGunGu,
      eupMyeonDong: addressInfo.eupMyeonDong,
      ri: addressInfo.ri,
      ...userAddress,
    });

    await Promise.all([createUser.save(), neighborhoodRegistration.save()]);

    const result = {
      email,
      nickname,
      petType,
      accessToken,
      refreshToken,
      address: addressInfo.eupMyeonDong,
    };

    return result;
  }

  async getUserAddresses(email: string, option: string) {
    try {
      const userAddresses: UserAddressDocument[] =
        await this.UserAddressModel.find({
          userEmail: email,
        }).lean();
      let pickAddress = '';

      const result = userAddresses
        .map((address: UserAddressDocument) => {
          if (address.isLastSelected) {
            pickAddress = address.eupMyeonDong;
          }

          const data = {
            id: address._id,
            address: address.eupMyeonDong,
            ...(!!address.isLastSelected && {
              isLastSelected: address.isLastSelected,
            }),
          };

          if (option === 'settings') {
            data.address = `${address.eupMyeonDong} ${
              !!address.ri ? address.ri : ''
            }`.trim();
          }

          return data;
        })
        .sort((_, b) => (b.isLastSelected ? 1 : -1));

      return {
        statusCode: 200,
        data: { pickAddress, addressInfoList: result },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async deleteAddress(email: string, id: string) {
    try {
      const userAddresses = await this.UserAddressModel.find({
        userEmail: email,
      }).lean();

      if (userAddresses.length === 1) {
        return {
          statusCode: 400,
          data: { message: '남은 동네가 1개 입니다.' },
        };
      }

      await this.UserAddressModel.deleteOne({ userEmail: email, _id: id });
      await this.UserAddressModel.updateOne(
        { userEmail: email },
        { isLastSelected: true }
      );

      const result = await this.getUserAddresses(email, 'settings');

      return result;
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async updateAddressLastSelected(email: string, id: string) {
    try {
      await this.UserAddressModel.updateMany(
        { userEmail: email },
        { isLastSelected: false }
      );
      await this.UserAddressModel.updateOne(
        {
          userEmail: email,
          _id: id,
        },
        { isLastSelected: true }
      );

      const result = await this.getUserAddresses(email, null);

      return result;
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  checkDuplicateAddress(userAddressList, longitude, latitude) {
    return userAddressList.some(
      (address) =>
        address.longitude == longitude && address.latitude == latitude
    );
  }

  async createUserAddress(
    email: string,
    {
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }
  ) {
    try {
      const userAddresses = await this.UserAddressModel.find({
        userEmail: email,
      }).lean();

      if (userAddresses.length >= 2) {
        return {
          statusCode: 412,
          data: { message: '최대 2개까지 설정할 수 있어요.' },
        };
      }

      if (this.checkDuplicateAddress(userAddresses, longitude, latitude)) {
        return {
          statusCode: 400,
          data: { message: '이미 설정되어 있는 동네입니다.' },
        };
      }

      const addressInfo = await this.CityAddressModel.findOne({
        'location.coordinates': [longitude, latitude],
      });
      const neighborhoodRegistration = new this.UserAddressModel({
        latitude,
        longitude,
        detail: addressInfo.detail,
        userEmail: email,
        isLastSelected: false,
        isAuth: false,
        siDo: addressInfo.siDo,
        siGunGu: addressInfo.siGunGu,
        eupMyeonDong: addressInfo.eupMyeonDong,
        ri: addressInfo.ri,
      });

      await neighborhoodRegistration.save();

      return { statusCode: 201, data: { isPosted: true } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async getRandomNickname() {
    const nickname = `${
      adjective[Math.floor(Math.random() * adjective.length)]
    }${faker.person.lastName()}${faker.person.firstName()}`;
    const existingNickname = await this.UserModel.findOne({ nickname });

    if (!!existingNickname) {
      return this.getRandomNickname();
    }

    return nickname;
  }

  async blockedUser(email: string, blockedBy: string) {
    try {
      const blockedUserQuery = new this.blockedUserModel({
        blockedBy,
        userId: email,
      });

      await blockedUserQuery.save();

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
