import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  Res,
  Param,
  Delete,
  Patch,
  Put,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('board')
export class BoardController {
  constructor(private boardService: BoardService) {}

  @Post('used-item')
  @UseInterceptors(FilesInterceptor('itemImages', 5))
  async generateUsedItemsBoard(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo,
    @Res() res
  ) {
    const email = res.locals.email;
    const result = await this.boardService.generateUsedItemsBoard(
      files,
      email,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json({ data: result.data });
  }

  @Get('used-item')
  async getUsedItemBoardList(
    @Res() res,
    @Query('topCategory') topCategory: string,
    @Query('subCategory') subCategory: string,
    @Query('limit') limit: number,
    @Query('page') page: number
  ) {
    const email = res.locals.email;
    const result = await this.boardService.getUsedItemBoardList(
      limit,
      page,
      topCategory,
      subCategory,
      email
    );
    return res.status(result.statusCode).json({ data: result.data });
  }

  @Get('used-item/:id')
  async getDetailUsedItemBoard(@Res() res, @Param('id') id: string) {
    const email = res.locals.email;
    const result = await this.boardService.getDetailUsedItemBoard(id, email);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/other-posts/:id')
  async getOtherUsedItemBoardList(
    @Res() res,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = res.locals.email;
    const result = await this.boardService.getOtherUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/similar-posts/:id')
  async getSimilarUsedBoardList(
    @Res() res,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = res.locals.email;
    const result = await this.boardService.getSimilarUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('used-item/like/:id')
  async likeBoard(@Res() res, @Param('id') id: string) {
    const email = res.locals.email;
    const result = await this.boardService.likeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/like/:id')
  async dislikeBoard(@Res() res, @Param('id') id: string) {
    const email = res.locals.email;
    const result = await this.boardService.dislikeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/:id')
  async deleteBoard(@Res() res, @Param('id') id: string) {
    const email = res.locals.email;
    const result = await this.boardService.deleteBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('used-item/status/:id')
  async changeBoardStatus(
    @Res() res,
    @Param('id') id: string,
    @Body('salesStatus') salesStatus: string
  ) {
    const result = await this.boardService.changeBoardStatus(id, salesStatus);

    return res.status(result.statusCode).json(result.data);
  }

  @Put('used-item/:id')
  @UseInterceptors(FilesInterceptor('newItemImages', 5))
  async updateBoard(
    @Res() res,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo
  ) {
    const email = res.locals.email;
    const result = await this.boardService.updateBoardInfo(
      files,
      email,
      id,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json(result.data);
  }
}
