import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { UserAddress, UserAddressDocument } from '../schema/userAddress.schema';
import { CityAddress, CityAddressDocument } from '../schema/cityAddress.schema';
import { fakerKO as faker } from '@faker-js/faker';
import { adjective } from './adjective';
import { AwsService } from '../utils/s3';
import { TokenService } from 'src/token/token.service';
import { UtilService } from 'src/utils/util.service';

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
