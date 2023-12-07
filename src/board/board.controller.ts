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
import { UsedItemBoardService } from './usedItemBoard.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';
import { PetMateBoardService } from './petMateBoard.service';

@Controller('board')
export class BoardController {
  constructor(
    private usedItemBoardService: UsedItemBoardService,
    private petMateBoardService: PetMateBoardService
  ) {}

  @Post('used-item')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('itemImages', 5))
  async generateUsedItemsBoard(
    @Req() req,
    @Res() res,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.generateUsedItemsBoard(
      files,
      email,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json({ data: result.data });
  }

  @Get('used-item')
  @UseGuards(JwtAccessAuthGuard)
  async getUsedItemBoardList(
    @Req() req,
    @Res() res,
    @Query('topCategory') topCategory: string,
    @Query('subCategory') subCategory: string,
    @Query('limit') limit: number,
    @Query('page') page: number
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getUsedItemBoardList(
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
    @Req() req,
    @Res() res,
    @Param('id') id: string
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getDetailUsedItemBoard(
      id,
      email
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/edit/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getEditUsedItemBoard(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getEditUsedItemBoard(
      id,
      email
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/other-posts/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getOtherUsedItemBoardList(
    @Req() req,
    @Res() res,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getOtherUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('used-item/similar-posts/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getSimilarUsedBoardList(
    @Req() req,
    @Res() res,
    @Param('id') id: string,
    @Query('limit') limit: string
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getSimilarUsedItemBoardList(
      email,
      id,
      limit
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('used-item/like/:id')
  @UseGuards(JwtAccessAuthGuard)
  async likeBoard(@Req() req, @Res() res, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.likeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/like/:id')
  @UseGuards(JwtAccessAuthGuard)
  async dislikeBoard(@Req() req, @Res() res, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.dislikeBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('used-item/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deleteBoard(@Req() req, @Res() res, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.deleteBoard(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('used-item/status/:id')
  @UseGuards(JwtAccessAuthGuard)
  async changeBoardStatus(
    @Res() res,
    @Param('id') id: string,
    @Body('salesStatus') salesStatus: string
  ) {
    const result = await this.usedItemBoardService.changeBoardStatus(
      id,
      salesStatus
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Put('used-item/:id')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('newItemImages', 5))
  async updateBoard(
    @Req() req,
    @Res() res,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() usedItemBoardInfo
  ) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.updateBoardInfo(
      files,
      email,
      id,
      usedItemBoardInfo
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('/used-items/completed-deals')
  @UseGuards(JwtAccessAuthGuard)
  async hasUsedItemsCompletedDealsOneHourAgo(@Req() req, @Res() res) {
    const email = req.user.email;
    const result =
      await this.usedItemBoardService.hasUsedItemsCompletedDealsOneHourAgo(
        email
      );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('/used-items/completed-deals')
  @UseGuards(JwtAccessAuthGuard)
  async getUsedItemsCompletedDealsOneHourAgo(@Req() req, @Res() res) {
    const email = req.user.email;
    const result =
      await this.usedItemBoardService.getUsedItemsCompletedDealsOneHourAgo(
        email
      );

    return res.status(result.statusCode).json(result.data);
  }

  @Get('/used-items/chats')
  @UseGuards(JwtAccessAuthGuard)
  async getUsedItemChatRooms(@Req() req, @Res() res, @Query('id') id: string) {
    const email = req.user.email;
    const result = await this.usedItemBoardService.getUsedItemChatRooms(
      email,
      id
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('/pet-mate')
  @UseGuards(JwtAccessAuthGuard)
  async createPetMateBoard(@Req() req, @Res() res, @Body() petMateBoardInfo) {
    const email = req.user.email;
    const result = await this.petMateBoardService.createPetMateBoard({
      host: email,
      ...petMateBoardInfo,
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Get('/pet-mate')
  @UseGuards(JwtAccessAuthGuard)
  async getPetMateBoardList(
    @Req() req,
    @Res() res,
    @Query('limit') limit,
    @Query('page') page,
    @Query('isRecruiting') isRecruiting
  ) {
    const email = req.user.email;
    const result = await this.petMateBoardService.getPetMateBoardList({
      email,
      limit,
      page,
      isRecruiting,
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Get('/pet-mate/:id')
  @UseGuards(JwtAccessAuthGuard)
  async getPetMateBoardInfo(@Req() req, @Res() res, @Param('id') id) {
    const email = req.user.email;
    const result = await this.petMateBoardService.getPetMateBoardInfo(
      email,
      id
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Post('/pet-mate/attend/:id')
  @UseGuards(JwtAccessAuthGuard)
  async applyForParticipation(
    @Req() req,
    @Res() res,
    @Param('id') id,
    @Body() applyForParticipationInfo
  ) {
    const email = req.user.email;
    const result = await this.petMateBoardService.applyForParticipation({
      email,
      id,
      ...applyForParticipationInfo,
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('pet-mate/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deletePetMateBoard(@Res() res, @Param('id') id: string) {
    const result = await this.petMateBoardService.deletePetMateBoard(id);

    return res.status(result.statusCode).json(result.data);
  }
}
