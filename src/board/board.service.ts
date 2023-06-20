import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardDocument } from '../schema/board.schema';
import { AwsService } from '../utils/s3';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import {
  UserAddress,
  UserAddressDocument,
} from 'src/schema/userAddress.schema';
import { AddressService } from 'src/address/address.service';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(UsedItemBoard.name)
    private UsedItemBoardModel: Model<UsedItemBoardDocument>,
    @InjectModel(UserAddress.name)
    private UserAddressModel: Model<UserAddressDocument>,
    private awsService: AwsService,
    private addressService: AddressService
  ) {}

  async generateUsedItemsBoard(
    files: Array<Express.Multer.File>,
    email: string,
    { topCategory, subCategory, title, description, price }
  ) {
    try {
      const userAddressInfo = await this.UserAddressModel.findOne({
        userEmail: email,
        isLastSelected: true,
      });
      const createUsedItemBoard = new this.UsedItemBoardModel({
        title,
        description,
        price,
        topCategory,
        subCategory,
        seller: email,
        address: userAddressInfo.eupMyeonDong,
        addressDetail: userAddressInfo.detail,
      });
      const saveResult = await createUsedItemBoard.save();
      const imageUploaded = files.map(async (file) => {
        return await this.awsService.uploadFileToS3(
          `usedItemImages/${String(saveResult._id)}/${uuid()}${dayjs().format(
            'YYYYMMDDHHmmss'
          )}`,
          file
        );
      });
      const imageUploadResults = await Promise.all(imageUploaded);
      const images = imageUploadResults.map((result) => result.url);
      await this.UsedItemBoardModel.updateOne(
        { _id: saveResult._id },
        { images }
      );

      return { statusCode: 201, data: { isPosted: true } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  computeTimeDifference(date) {
    const diffMillisecond = dayjs().diff(date);
    const diffMonth = dayjs().diff(date, 'm');
    const diffYear = dayjs().diff(date, 'y');

    if (diffMillisecond < 1000 * 60) {
      return '방금 전';
    } else if (diffMillisecond < 1000 * 60 * 60) {
      return `${dayjs().diff(date, 'm')}분 전`;
    } else if (diffMillisecond < 1000 * 60 * 60 * 24) {
      return `${dayjs().diff(date, 'h')}시간 전`;
    } else if (diffMillisecond < 1000 * 60 * 60 * 24 * 7) {
      return `${dayjs().diff(date, 'd')}일 전`;
    } else if (diffMillisecond < 1000 * 60 * 60 * 24 * 7 * 2) {
      return '지난 주';
    } else if (diffMonth < 1) {
      return `${dayjs().diff(date, 'w')}주 전`;
    } else if (diffYear < 1) {
      return `${diffMonth}달 전`;
    }

    return `${diffYear}년 전`;
  }

  formatUsedItemBoard(usedItemBoardInfo) {
    return {
      id: usedItemBoardInfo._id,
      title: usedItemBoardInfo.title,
      price: usedItemBoardInfo.price.toLocaleString(),
      timeDelta: this.computeTimeDifference(usedItemBoardInfo.createdAt),
      image: usedItemBoardInfo.images[0],
      address: usedItemBoardInfo.address,
      likeCount: usedItemBoardInfo.likeCount,
      chatCount: 0,
    };
  }

  formatUsedItemBoardList(usedItemBoardList) {
    return usedItemBoardList.map((usedItemBoard) =>
      this.formatUsedItemBoard(usedItemBoard)
    );
  }

  async getUsedItemBoardList(
    limit: number,
    page: number,
    topCategory: string,
    subCategory: string = '',
    email: string
  ) {
    try {
      const userAddressInfo = await this.UserAddressModel.findOne({
        userEmail: email,
        isLastSelected: true,
      });
      const nearbyNeighborhoods = await this.addressService.getNearbyAddresses(
        userAddressInfo.latitude,
        userAddressInfo.longitude
      );
      const findQuery = nearbyNeighborhoods.map((nearbyNeighborhood) => {
        return { addressDetail: nearbyNeighborhood.address };
      });
      const usedItemBoardList = await this.UsedItemBoardModel.find({
        $and: [
          { topCategory },
          { isVisible: false },
          ...(!!subCategory ? [{ subCategory }] : []),
        ],
        $or: [
          ...findQuery,
          { topCategory: '전체' },
          { salesStatus: '판매중' },
          { salesStatus: '예약중' },
        ],
      })
        .skip(page * limit)
        .limit(limit)
        .sort({ createdAt: 'desc' });
      const result = this.formatUsedItemBoardList(usedItemBoardList);

      return { statusCode: 200, data: { usedItemBoardList: result } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }
}
