import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schema/address.schema';
import { User, UserDocument } from '../schema/user.schema';
import { fakerKO as faker } from '@faker-js/faker';
import { adjective } from './adjective';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Address.name) private AddressModel: Model<AddressDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>
  ) {}

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
