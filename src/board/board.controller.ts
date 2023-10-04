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
  UseGuards,
  Req,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';

@Controller('board')
export class BoardController {
  constructor(private boardService: BoardService) {}

  @Post('used-item')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('itemImages', 5))
  async generateUsedItemsBoard(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo,
    @Res() res,
    @Req() req
  ) {
    const email = req.user.email;
    const result = await this.boardService.generateUsedItemsBoard(
      files,
      email,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json({ data: result.data });
  }

  @Get('used-item')
  @UseGuards(JwtAccessAuthGuard)
  async getUsedItemBoardList(
    @Res() res,
    @Req() req,
    @Query('topCategory') topCategory: string,
    @Query('subCategory') subCategory: string,
    @Query('limit') limit: number,
    @Query('page') page: number
  ) {
    const email = req.user.email;
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
  @UseGuards(JwtAccessAuthGuard)
  async getDetailUsedItemBoard(
    @Res() res,
    @Req() req,
    @Param('id') id: string
  ) {
    const email = req.user.email;
    const result = await this.boardService.getDetailUsedItemBoard(id, email);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/edit/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getEditUsedItemBoard(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.boardService.getEditUsedItemBoard(id, email);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/other-posts/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getOtherUsedItemBoardList(
    @Res() res,
    @Req() req,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = req.user.email;
    const result = await this.boardService.getOtherUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/similar-posts/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getSimilarUsedBoardList(
    @Res() res,
    @Req() req,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = req.user.email;
    const result = await this.boardService.getSimilarUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('used-item/like/:id')
  @UseGuards(JwtAccessAuthGuard)
  async likeBoard(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.boardService.likeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/like/:id')
  @UseGuards(JwtAccessAuthGuard)
  async dislikeBoard(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.boardService.dislikeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deleteBoard(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.boardService.deleteBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('used-item/status/:id')
  @UseGuards(JwtAccessAuthGuard)
  async changeBoardStatus(
    @Res() res,
    @Req() req,
    @Param('id') id: string,
    @Body('salesStatus') salesStatus: string
  ) {
    const result = await this.boardService.changeBoardStatus(id, salesStatus);

    return res.status(result.statusCode).json(result.data);
  }

  @Put('used-item/:id')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('newItemImages', 5))
  async updateBoard(
    @Res() res,
    @Req() req,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo
  ) {
    const email = req.user.email;
    const result = await this.boardService.updateBoardInfo(
      files,
      email,
      id,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('/used-items/completed-deals')
  @UseGuards(JwtAccessAuthGuard)
  async hasUsedItemsCompletedDealsOneHourAgo(@Res() res, @Req() req) {
    const email = req.user.email;
    const result = await this.boardService.hasUsedItemsCompletedDealsOneHourAgo(
      email
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('/used-items/completed-deals')
  @UseGuards(JwtAccessAuthGuard)
  async getUsedItemsCompletedDealsOneHourAgo(@Res() res, @Req() req) {
    const email = req.user.email;
    const result = await this.boardService.getUsedItemsCompletedDealsOneHourAgo(
      email
    );

    return res.status(result.statusCode).json(result.data);
  }
}
