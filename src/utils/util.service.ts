import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';
import {
  ONE_MINUTE,
  ONE_HOUR,
  DAY_HOURS,
  ONE_WEEK,
  TWO_WEEK,
  ONE_MONTH,
  ONE_YEAR,
} from '../config/constants/index';
import * as dayjs from 'dayjs';

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

  computeTimeDifference(date) {
    const diffMillisecond = dayjs().diff(date);
    const diffMonth = dayjs().diff(date, 'M');
    const diffYear = dayjs().diff(date, 'y');

    if (diffMillisecond < ONE_MINUTE) {
      return '방금 전';
    } else if (diffMillisecond < ONE_HOUR) {
      return `${dayjs().diff(date, 'm')}분 전`;
    } else if (diffMillisecond < DAY_HOURS) {
      return `${dayjs().diff(date, 'h')}시간 전`;
    } else if (diffMillisecond < ONE_WEEK) {
      return `${dayjs().diff(date, 'd')}일 전`;
    } else if (diffMillisecond < TWO_WEEK) {
      return '지난 주';
    } else if (diffMonth < ONE_MONTH) {
      return `${dayjs().diff(date, 'w')}주 전`;
    } else if (diffYear < ONE_YEAR) {
      return `${diffMonth}달 전`;
    }

    return `${diffYear}년 전`;
  }
}
