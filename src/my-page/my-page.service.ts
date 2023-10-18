import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from 'src/schema/pet.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';
import { PetType, PetGender } from 'src/config/type';
import * as dayjs from 'dayjs';
import { AwsService } from 'src/utils/s3';

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

  formatPets(pets) {
    return pets.map((pet) => {
      return {
        id: pet._id,
        name: pet.name.length > 3 ? `${pet.name.substring(0, 2)}...` : pet.name,
        type: PetType[pet.type],
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

  async getPet(id: string) {
    try {
      const pet = await this.petModel.findOne({ _id: id });
      console.log(pet);
      const result = {
        name: pet.name,
        gender: PetGender[pet.gender],
        species: pet.species,
        unusualCondition: pet.unusualCondition,
        birthday: dayjs(pet.birthday).format('YYYY. MM. DD'),
        neuteredStatus: pet.neuteredStatus,
        helloMessage: pet.helloMessage,
        ...(!!pet.weight && { weight: `${pet.weight} kg` }),
        ...(!!pet.images.length && { images: pet.images }),
      };

      return { statusCode: 200, data: { petInfo: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePet(id: string) {
    try {
      await this.petModel.deleteOne({ _id: id });

      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPetInfo(id: string) {
    try {
      const petInfo = await this.petModel.findOne({ _id: id });
      const result = {
        name: petInfo.name,
        gender: PetGender[petInfo.gender],
        species: petInfo.species,
        birthday: petInfo.birthday,
        unusualCondition: petInfo.unusualCondition,
        neuteredStatus: petInfo.neuteredStatus,
        helloMessage: petInfo.helloMessage,
        weight: petInfo.weight,
        ...(!!petInfo.images.length && { images: petInfo.images }),
      };

      return { statusCode: 200, data: { petInfo: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserProfile(email: string) {
    try {
      const userInfo = await this.userModel.findOne({ email });
      const result = {
        email,
        nickname: userInfo.nickname,
        ...(!!userInfo.profileImage && { image: userInfo.profileImage }),
      };

      return { statusCode: 200, data: { userProfile: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async patchUserProfile(
    email: string,
    { newProfileImage, profileImage, nickname }
  ) {
    try {
      const newProfileImageUrl = await (async () => {
        if (!!newProfileImage) {
          const result = await this.awsService.uploadFileToS3(
            `profileImages/${email}/${email}.jpeg`,
            newProfileImage
          );

          return result.url;
        }

        return null;
      })();

      if (!!nickname) {
        await this.userModel.updateOne(
          { email },
          {
            nickname,
            ...(!!newProfileImage && { profileImage: newProfileImageUrl }),
            ...(!profileImage &&
              !newProfileImage && {
                $unset: {
                  profileImage: 1,
                },
              }),
          }
        );
      }

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
