import { Injectable } from '@nestjs/common';
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
import { isSet } from 'util/types';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    @InjectModel(CityAddress.name)
    private CityAddressModel: Model<CityAddressDocument>,
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

      const result = userAddresses.map((address: UserAddressDocument) => {
        const data = {
          id: address._id,
          address: address.eupMyeonDong,
        };

        if (option === 'settings') {
          data.address = `${
            !!address.siGunGu ? address.siGunGu : address.siDo
          } ${address.eupMyeonDong}`;
        }

        return data;
      });

      return { statusCode: 200, data: { addressInfoList: result } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async deleteAddress(email: string, id: string) {
    try {
      await this.UserAddressModel.deleteOne({ userEmail: email, _id: id });
      await this.UserAddressModel.updateOne(
        { userEmail: email },
        { isLastSelected: true }
      );

      return { statusCode: 200, data: { isDeleted: true } };
    } catch (error) {
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

      return { statusCode: 200, data: { isPatched: true } };
    } catch (error) {
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async createUserAddress(
    email: string,
    {
      detail,
      latitude,
      longitude,
      isChanged = false,
    }: {
      detail: string;
      latitude: number;
      longitude: number;
      isChanged: boolean;
    }
  ) {
    try {
      const userAddresses = await this.UserAddressModel.find({
        userEmail: email,
      }).lean();

      if (userAddresses.length >= 2) {
        return {
          statusCode: 400,
          data: { message: '최대 2개까지 설정할 수 있어요.' },
        };
      }

      const addressInfo = await this.CityAddressModel.findOne({
        detail,
      });
      const neighborhoodRegistration = new this.UserAddressModel({
        detail,
        latitude,
        longitude,
        userEmail: email,
        isLastSelected: false,
        isAuth: false,
        siDo: addressInfo.siDo,
        siGunGu: addressInfo.siGunGu,
        eupMyeonDong: addressInfo.eupMyeonDong,
        ri: addressInfo.ri,
      });

      await neighborhoodRegistration.save();

      if (isChanged) {
        await this.UserAddressModel.updateMany(
          { userEmail: email },
          { isLastSelected: false }
        );

        await this.UserAddressModel.updateOne(
          { detail, userEmail: email },
          { isLastSelected: true }
        );
      }

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
}
