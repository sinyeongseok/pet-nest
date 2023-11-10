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
import { v4 as uuid } from 'uuid';

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
      const userAddress = userAddressInfo
        .map((userAddress) => userAddress.eupMyeonDong)
        .join(' / ');
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

  formatOtherPets(otherPets) {
    return otherPets.map((pet) => {
      return {
        id: pet._id,
        name: pet.name.length > 3 ? `${pet.name.substring(0, 2)}...` : pet.name,
        ...(!!pet.images.length && { image: pet.images[0] }),
      };
    });
  }

  async getPetInfo(email: string, id: string) {
    try {
      const [petInfo, getOtherPets] = await Promise.all([
        this.petModel.findOne({ _id: id }),
        this.petModel.find({
          _id: { $not: { $eq: id } },
          userEmail: email,
        }),
      ]);
      const otherPets = this.formatOtherPets(getOtherPets);
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
        ...(!!otherPets.length && { otherPets }),
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

  async deleteUnusedImage(images, newImages) {
    const isSameArray =
      images.length === newImages.length &&
      images.every((value, idx) => value === newImages[idx]);

    if (isSameArray) {
      return;
    }

    for await (const image of images) {
      if (!newImages.includes(image)) {
        await this.awsService.deleteS3Object(image);
      }
    }
  }

  async updatePetInfo(
    files: Array<Express.Multer.File>,
    email: string,
    petId: string,
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
      images,
    }
  ) {
    try {
      const [year, month, day] = birthday.split(' ');
      const birthdayToDate = new Date(
        `${parseInt(year)} ${parseInt(month)} ${parseInt(day)}`
      );

      const petInfo = await this.petModel.findOne({ _id: petId });
      const currentImage = !!images ? JSON.parse(images) : [];
      await this.deleteUnusedImage(petInfo.images, currentImage);
      const imageUploaded = files.map(async (file) => {
        return await this.awsService.uploadFileToS3(
          `petImages/${email}/${String(petId)}/${uuid()}${dayjs().format(
            'YYYYMMDDHHmmss'
          )}`,
          file
        );
      });
      const imageUploadResults = await Promise.all(imageUploaded);
      const newImages = imageUploadResults.map((result) => result.url);
      await this.petModel.updateOne(
        { _id: petId },
        {
          type,
          name,
          speciesInputType,
          species,
          gender,
          neuteredStatus,
          weight,
          unusualCondition,
          helloMessage,
          birthday: birthdayToDate,
          images: [...currentImage, ...newImages],
        }
      );

      return { statusCode: 200, data: { isUpdated: true } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPetEditPageInfo(id: string) {
    try {
      const pet = await this.petModel.findOne({ _id: id });
      const result = {
        type: pet.type,
        name: pet.name,
        gender: pet.gender,
        speciesInputType: pet.speciesInputType,
        species: pet.species,
        unusualCondition: pet.unusualCondition,
        birthday: pet.birthday,
        neuteredStatus: pet.neuteredStatus,
        helloMessage: pet.helloMessage,
        weight: pet.weight,
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
}
