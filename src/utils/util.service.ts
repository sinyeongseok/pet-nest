import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';

@Injectable()
export class UtilService {
  constructor(
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>
  ) {}

  async getUserRecentAddress(email: string) {
    const userAddressInfo = await this.UserAddressModel.findOne({
      userEmail: email,
      isLastSelected: true,
    });

    return userAddressInfo;
  }
}
