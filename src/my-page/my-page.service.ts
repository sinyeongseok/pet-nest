import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from 'src/schema/pet.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';
import { AwsService } from 'src/utils/s3';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';

@Injectable()
export class MyPageService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(UserAddress.name)
    private userAddressModel: Model<UserAddressDocument>,
    @InjectModel(Pet.name)
    private petModel: Model<PetDocument>,
    private awsService: AwsService
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

  async createPet(
    email,
    files,
    {
      name,
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
        name,
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
