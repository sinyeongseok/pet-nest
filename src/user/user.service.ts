import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schema/address.schema';
import { User, UserDocument } from '../schema/user.schema';
import { fakerKO as faker } from '@faker-js/faker';
import { adjective } from './adjective';
import { AwsService } from '../utils/s3';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Address.name) private AddressModel: Model<AddressDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private awsService: AwsService,
    private authService: AuthService
  ) {}

  async createProfile(file, { email, nickname, petType, address }) {
    const profileImage = await (async () => {
      if (!!file) {
        const result = await this.awsService.uploadFileToS3(
          `${email}/${email}.jpeg`,
          file
        );

        return result.url;
      }

      return undefined;
    })();
    const userAddress = JSON.parse(address);
    const accessToken = this.authService.generateAccessToken(email);
    const refreshToken = this.authService.generateRefreshToken(email);
    const createUser = new this.UserModel({
      email,
      nickname,
      petType,
      refreshToken,
      address: userAddress,
      ...(!!profileImage && { profileImage }),
    });
    await createUser.save();

    const result = {
      email,
      nickname,
      petType,
      accessToken,
      refreshToken,
      address: userAddress.detail,
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
