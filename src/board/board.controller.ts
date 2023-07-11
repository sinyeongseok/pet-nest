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
}
