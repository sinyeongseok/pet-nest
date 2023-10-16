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
import { AuthService } from 'src/auth/auth.service';
import * as dayjs from 'dayjs';
import { Pet, PetDocument } from 'src/schema/pet.schema';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    @InjectModel(CityAddress.name)
    private CityAddressModel: Model<CityAddressDocument>,
    @InjectModel(Pet.name)
    private petModel: Model<PetDocument>,
    private awsService: AwsService,
    private tokenService: TokenService,
    private authService: AuthService
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

  async updateNickname(email: string, nickname: string) {
    try {
      await this.authService.validateNickname(nickname);

      await this.UserModel.updateOne({ email }, { nickname });

      return { statusCode: 200, data: { userNickname: nickname } };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw new HttpException(
          '닉네임 확인이 필요합니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createPet(
    email,
    files,
    {
      type,
      name,
      speciesInputType,
      species,
      birthday,
      gender,
      neuteredStatus,
      weight,
      unusualCondition,
      helloMessage,
    }
  ) {
    try {
      const createPetQuery = new this.petModel({
        type,
        name,
        speciesInputType,
        species,
        birthday,
        gender,
        neuteredStatus,
        weight,
        unusualCondition,
        helloMessage,
        userEmail: email,
      });
      const saveResult = await createPetQuery.save();
      const imageUploaded = files.map(async (file) => {
        return await this.awsService.uploadFileToS3(
          `petImages/${email}/${String(
            saveResult._id
          )}/${uuid()}${dayjs().format('YYYYMMDDHHmmss')}`,
          file
        );
      });
      const imageUploadResults = await Promise.all(imageUploaded);
      const images = imageUploadResults.map((result) => result.url);
      await this.petModel.updateOne({ _id: saveResult._id }, { images });

      return { statusCode: 201, data: { isCreated: true } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
