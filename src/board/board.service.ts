import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardDocument } from '../schema/board.schema';
import { AwsService } from '../utils/s3';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import { AddressService } from 'src/address/address.service';
import { UtilService } from 'src/utils/util.service';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(UsedItemBoard.name)
    private usedItemBoardModel: Model<UsedItemBoardDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private awsService: AwsService,
    private addressService: AddressService,
    private utilService: UtilService
  ) {}

  async getNearbyPostsQueryBasedOnUserAddress(email: string) {
    const userAddressInfo = await this.utilService.getUserRecentAddress(email);
    const nearbyNeighborhoods = await this.addressService.getNearbyAddresses(
      userAddressInfo.latitude,
      userAddressInfo.longitude
    );
    const findQuery = nearbyNeighborhoods.map((nearbyNeighborhood) => {
      return { addressDetail: nearbyNeighborhood.address };
    });

    return findQuery;
  }

  async generateUsedItemsBoard(
    files: Array<Express.Multer.File>,
    email: string,
    { topCategory, subCategory, title, description, price }
  ) {
    try {
      const userAddressInfo = await this.utilService.getUserRecentAddress(
        email
      );
      const userInfo = await this.userModel.findOne({ email });
      const createUsedItemBoard = new this.usedItemBoardModel({
        title,
        description,
        price,
        topCategory,
        subCategory,
        seller: {
          email,
          nickname: userInfo.nickname,
          profileImage: userInfo.profileImage,
        },
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
      await this.usedItemBoardModel.updateOne(
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
    const diffMonth = dayjs().diff(date, 'M');
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

  formatUsedItemBoard(usedItemBoardInfo, email) {
    return {
      id: usedItemBoardInfo._id,
      title: usedItemBoardInfo.title,
      price: usedItemBoardInfo.price.toLocaleString(),
      timeDelta: this.computeTimeDifference(usedItemBoardInfo.createdAt),
      image: usedItemBoardInfo.images[0],
      address: usedItemBoardInfo.address,
      salesStatus: usedItemBoardInfo.salesStatus,
      likeCount: usedItemBoardInfo.likeCount,
      chatCount: 0,
    };
  }

  formatUsedItemBoardList(usedItemBoardList, email) {
    return usedItemBoardList.map((usedItemBoard) =>
      this.formatUsedItemBoard(usedItemBoard, email)
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
      const findQuery = await this.getNearbyPostsQueryBasedOnUserAddress(email);
      const usedItemBoardList = await this.usedItemBoardModel
        .find({
          $and: [
            { topCategory },
            { isVisible: false },
            { $or: findQuery },
            ...(!!subCategory ? [{ subCategory }] : []),
          ],
          $or: [
            { topCategory: '전체' },
            { salesStatus: { $in: ['판매중', '예약중'] } },
          ],
        })
        .skip(page * limit)
        .limit(limit)
        .sort({ createdAt: 'desc' });
      const result = this.formatUsedItemBoardList(usedItemBoardList, email);

      return { statusCode: 200, data: { usedItemBoardList: result } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async isBoardLikedByUser(email: string, id: Types.ObjectId) {
    const user = await this.userModel.findOne({ email: email }).exec();

    if (!user) {
      return false;
    }

    return user.likedBoards.includes(id);
  }

  async formatDetailUsedItemBoard(usedItemBoardInfo, email) {
    const isLike = await this.isBoardLikedByUser(email, usedItemBoardInfo._id);
    return {
      isLike,
      sellerNickname: usedItemBoardInfo.seller.nickname,
      title: usedItemBoardInfo.title,
      address: usedItemBoardInfo.address,
      subCategory: usedItemBoardInfo.subCategory,
      timeDelta: this.computeTimeDifference(usedItemBoardInfo.createdAt),
      description: usedItemBoardInfo.description,
      likeCount: usedItemBoardInfo.likeCount,
      chatCount: 0,
      viewCount: usedItemBoardInfo.viewCount,
      salesStatus: usedItemBoardInfo.salesStatus,
      images: usedItemBoardInfo.images,
      ...(!!usedItemBoardInfo.seller.profileImage && {
        sellerProfileImage: usedItemBoardInfo.seller.profileImage,
      }),
      ...(usedItemBoardInfo.seller.email === email && { isMe: true }),
    };
  }

  async getDetailUsedItemBoard(id: string, email: string) {
    try {
      const usedItemBoardInfo = await (async () => {
        const usedItemBoard = await this.usedItemBoardModel.findOne({
          _id: id,
        });

        if (!usedItemBoard.viewedUsers.includes(email)) {
          return await this.usedItemBoardModel
            .findByIdAndUpdate(
              { _id: id },
              { $inc: { viewCount: 1 }, $push: { viewedUsers: email } },
              { new: true }
            )
            .exec();
        }

        return usedItemBoard;
      })();
      const result = await this.formatDetailUsedItemBoard(
        usedItemBoardInfo,
        email
      );

      return { statusCode: 200, data: { usedItemBoardInfo: result } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  formatUsedItemBoardListResult(similarUsedItemBoardList) {
    return similarUsedItemBoardList.map((similarUsedItemBoard) => {
      return {
        id: similarUsedItemBoard._id,
        image: similarUsedItemBoard.images[0],
        title: similarUsedItemBoard.title,
        price: similarUsedItemBoard.price,
      };
    });
  }

  async getSimilarUsedItemBoardList(email: string, id: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });
      const findQuery = await this.getNearbyPostsQueryBasedOnUserAddress(email);
      const similarUsedItemBoards = await this.usedItemBoardModel
        .find({
          $and: [
            { subCategory: usedItemBoardInfo.subCategory },
            { _id: { $ne: usedItemBoardInfo._id } },
            { $or: findQuery },
          ],
        })
        .limit(6)
        .sort({ createdAt: 'desc' });
      const result = this.formatUsedItemBoardListResult(similarUsedItemBoards);

      return {
        statusCode: 200,
        data: { similarUsedItemBoardList: result },
      };
    } catch (error) {
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async getOtherUsedItemBoardList(email: string, id: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });
      const findQuery = await this.getNearbyPostsQueryBasedOnUserAddress(email);
      const otherUsedItemBoards = await this.usedItemBoardModel
        .find({
          $and: [
            { 'seller.email': usedItemBoardInfo.seller.email },
            { _id: { $ne: usedItemBoardInfo._id } },
            { $or: findQuery },
          ],
        })
        .limit(6)
        .sort({ createdAt: 'desc' });
      const result = this.formatUsedItemBoardListResult(otherUsedItemBoards);

      return {
        statusCode: 200,
        data: { otherUsedItemBoardList: result },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async deleteBoard(email: string, id: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });

      if (usedItemBoardInfo.seller.email !== email) {
        return {
          statusCode: 400,
          data: { message: '본인의 게시글이 아닙니다.' },
        };
      }

      await this.usedItemBoardModel.deleteOne({ _id: id });

      return { statusCode: 204, data: { isDeleted: true } };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async likeBoard(email: string, id: string) {
    try {
      await this.userModel.updateOne(
        { email },
        {
          $addToSet: { likedBoards: id },
        }
      );

      const updateData = await this.usedItemBoardModel.findByIdAndUpdate(
        { _id: id },
        {
          $inc: { likeCount: 1 },
        },
        { new: true }
      );

      return {
        statusCode: 200,
        data: { isLike: true, likeCount: updateData.likeCount },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async dislikeBoard(email: string, id: string) {
    try {
      await this.userModel.updateOne(
        { email },
        {
          $pull: { likedBoards: id },
        }
      );
      const updateData = await this.usedItemBoardModel.findByIdAndUpdate(
        { _id: id },
        {
          $inc: { likeCount: -1 },
        },
        { new: true }
      );

      return {
        statusCode: 200,
        data: { isLike: false, likeCount: updateData.likeCount },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }

  async changeBoardStatus(id: string, salesStatus: string) {
    try {
      await this.usedItemBoardModel
        .findByIdAndUpdate(id, { salesStatus })
        .exec();

      return {
        statusCode: 200,
        data: { salesStatus },
      };
    } catch (error) {
      console.log(error);
      return { statusCode: 500, data: { message: '서버요청 실패.' } };
    }
  }
}
