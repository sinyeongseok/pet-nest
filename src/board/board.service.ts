import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model, Query, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsedItemBoard, UsedItemBoardDocument } from '../schema/board.schema';
import { AwsService } from '../utils/s3';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import { AddressService } from 'src/address/address.service';
import { UtilService } from 'src/utils/util.service';
import { User, UserDocument } from 'src/schema/user.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schema/chatRoom.schema';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(UsedItemBoard.name)
    private usedItemBoardModel: Model<UsedItemBoardDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
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
    const requiredFields = {
      title: '상품명',
      topCategory: '카테고리',
      subCategory: '서브카테고리',
      price: '가격',
      description: '내용',
    };

    const emptyFields = Object.keys(requiredFields).reduce((res, field) => {
      if (!arguments[2][field]) res.push(requiredFields[field]);
      return res;
    }, []);

    if (emptyFields.length > 0) {
      const errorMessage = `${emptyFields.join(
        ', '
      )}은(는) 필수로 입력해주세요.`;
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }

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
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  formatUsedItemBoard(usedItemBoardInfo) {
    return {
      id: usedItemBoardInfo._id,
      title: usedItemBoardInfo.title,
      timeDelta: this.utilService.computeTimeDifference(
        usedItemBoardInfo.createdAt
      ),
      image: usedItemBoardInfo.images[0],
      address: usedItemBoardInfo.address,
      salesStatus: usedItemBoardInfo.salesStatus,
      likeCount: usedItemBoardInfo.likeCount,
      chatCount: 0,
      price:
        usedItemBoardInfo.price > 0
          ? `${usedItemBoardInfo.price.toLocaleString()}원`
          : '무료나눔',
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
      const result = this.formatUsedItemBoardList(usedItemBoardList);

      return { statusCode: 200, data: { usedItemBoardList: result } };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
      sellerEmail: usedItemBoardInfo.seller.email,
      title: usedItemBoardInfo.title,
      address: usedItemBoardInfo.address,
      subCategory: usedItemBoardInfo.subCategory,
      timeDelta: this.utilService.computeTimeDifference(
        usedItemBoardInfo.createdAt
      ),
      description: usedItemBoardInfo.description,
      likeCount: usedItemBoardInfo.likeCount,
      chatCount: 0,
      viewCount: usedItemBoardInfo.viewCount,
      salesStatus: usedItemBoardInfo.salesStatus,
      images: usedItemBoardInfo.images,
      price:
        usedItemBoardInfo.price > 0
          ? `${usedItemBoardInfo.price.toLocaleString()}원`
          : '무료나눔',
      ...(!!usedItemBoardInfo.seller.profileImage && {
        sellerProfileImage: usedItemBoardInfo.seller.profileImage,
      }),
      ...(usedItemBoardInfo.seller.email === email && { isMe: true }),
    };
  }

  async getDetailUsedItemBoard(id: string, email: string) {
    try {
      const getUsedItemBoardInfo = await (async () => {
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
      const chatInfo = await this.chatRoomModel.findOne({
        boardId: id,
        users: {
          $in: [email],
        },
      });
      const usedItemBoardInfo = await this.formatDetailUsedItemBoard(
        getUsedItemBoardInfo,
        email
      );
      const result = {
        usedItemBoardInfo,
        ...(!!chatInfo && { chatRoomInfo: { id: chatInfo._id } }),
      };

      return { statusCode: 200, data: result };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  formatEditUsedItemBoard(usedItemBoard: UsedItemBoardDocument) {
    return {
      id: usedItemBoard._id,
      topCategory: usedItemBoard.topCategory,
      subCategory: usedItemBoard.subCategory,
      title: usedItemBoard.title,
      images: usedItemBoard.images,
      description: usedItemBoard.description,
      price: usedItemBoard.price,
    };
  }

  async getEditUsedItemBoard(id: string, email: string) {
    try {
      const boardInfo: UsedItemBoardDocument =
        await this.usedItemBoardModel.findOne({
          _id: id,
        });

      if (boardInfo.seller.email !== email) {
        throw new HttpException(
          '본인의 게시물이 아닙니다.',
          HttpStatus.BAD_REQUEST
        );
      }
      const result = this.formatEditUsedItemBoard(boardInfo);

      return { statusCode: 200, data: { editUsedItemBoardInfo: result } };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  formatUsedItemBoardListResult(similarUsedItemBoardList) {
    return similarUsedItemBoardList.map((similarUsedItemBoard) => {
      return {
        id: similarUsedItemBoard._id,
        image: similarUsedItemBoard.images[0],
        title: similarUsedItemBoard.title,
        price:
          similarUsedItemBoard.price > 0
            ? `${similarUsedItemBoard.price.toLocaleString()}원`
            : '무료나눔',
      };
    });
  }

  async getSimilarUsedItemBoardList(email: string, id: string, limit: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });
      const findQuery = await this.getNearbyPostsQueryBasedOnUserAddress(email);
      const similarUsedItemBoardsQuery = this.usedItemBoardModel
        .find({
          $and: [
            { subCategory: usedItemBoardInfo.subCategory },
            { _id: { $ne: usedItemBoardInfo._id } },
            { 'seller.email': { $ne: email } },
            { $or: findQuery },
          ],
        })
        .sort({ createdAt: 'desc' });

      if (!!limit) {
        similarUsedItemBoardsQuery.limit(Number(limit));
      }

      const similarUsedItemBoards = await similarUsedItemBoardsQuery;
      const result = this.formatUsedItemBoardListResult(similarUsedItemBoards);

      return {
        statusCode: 200,
        data: { similarUsedItemBoardList: result },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getOtherUsedItemBoardList(email: string, id: string, limit: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });
      const findQuery = await this.getNearbyPostsQueryBasedOnUserAddress(email);
      const otherUsedItemBoardsQuery = this.usedItemBoardModel
        .find({
          $and: [
            { 'seller.email': usedItemBoardInfo.seller.email },
            { _id: { $ne: usedItemBoardInfo._id } },
            { $or: findQuery },
          ],
        })
        .sort({ createdAt: 'desc' });

      if (!!limit) {
        otherUsedItemBoardsQuery.limit(Number(limit));
      }

      const otherUsedItemBoards = await otherUsedItemBoardsQuery;
      const result = this.formatUsedItemBoardListResult(otherUsedItemBoards);

      return {
        statusCode: 200,
        data: { otherUsedItemBoardList: result },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteBoard(email: string, id: string) {
    try {
      const usedItemBoardInfo = await this.usedItemBoardModel.findOne({
        _id: id,
      });

      if (usedItemBoardInfo.seller.email !== email) {
        throw new HttpException(
          '본인의 게시글이 아닙니다.',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.usedItemBoardModel.deleteOne({ _id: id });

      return { statusCode: 204, data: { isDeleted: true } };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
      throw new HttpException(
        '서버요청 실패.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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

  async updateBoardInfo(
    files: Array<Express.Multer.File>,
    email: string,
    boardId: string,
    { topCategory, subCategory, title, description, price, images }
  ) {
    try {
      const boardInfo = await this.usedItemBoardModel.findOne({ _id: boardId });
      await this.deleteUnusedImage(boardInfo.images, JSON.parse(images));
      const imageUploaded = files.map(async (file) => {
        return await this.awsService.uploadFileToS3(
          `usedItemImages/${boardId}/${uuid()}${dayjs().format(
            'YYYYMMDDHHmmss'
          )}`,
          file
        );
      });
      const imageUploadResults = await Promise.all(imageUploaded);
      const newImages = imageUploadResults.map((result) => result.url);
      await this.usedItemBoardModel.updateOne(
        { _id: boardId },
        {
          topCategory,
          subCategory,
          title,
          description,
          price,
          images: [...JSON.parse(images), ...newImages],
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
}
