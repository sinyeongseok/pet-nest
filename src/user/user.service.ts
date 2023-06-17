import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { UserAddress, UserAddressDocument } from '../schema/userAddress.schema';
import { Address, AddressDocument } from '../schema/address.schema';
import { fakerKO as faker } from '@faker-js/faker';
import { adjective } from './adjective';
import { AwsService } from '../utils/s3';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    @InjectModel(Address.name)
    private addressModel: Model<AddressDocument>,
    private awsService: AwsService,
    private tokenService: TokenService
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
    const addressInfo = await this.addressModel.findOne({
      coordinate: `${userAddress.latitude},${userAddress.longitude}`,
    });
    console.log(addressInfo);
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
