import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('room')
  @UseGuards(JwtAccessAuthGuard)
  async createChatRoom(
    @Req() req,
    @Res() res,
    @Body('boardId') boardId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.createChatRoom(email, boardId);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('room/header')
  @UseGuards(JwtAccessAuthGuard)
  async getChatRoomHeaderInfo(
    @Req() req,
    @Res() res,
    @Query('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.getChatRoomHeaderInfo(
      email,
      chatRoomId
    );

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('alarm/:chatRoomId')
  @UseGuards(JwtAccessAuthGuard)
  async patchChatAlarm(
    @Req() req,
    @Res() res,
    @Param('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.patchChatRoomSetting({
      email,
      chatRoomId,
      patchItem: 'isAlarm',
    });

    return res.status(result.statusCode).json(result.data);
  }
  @Patch('header/alarm/:chatRoomId')
  @UseGuards(JwtAccessAuthGuard)
  async patchChatHeaderAlarm(
    @Req() req,
    @Res() res,
    @Param('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.patchChatRoomSetting({
      email,
      chatRoomId,
      patchItem: 'isAlarm',
      isChatListVisible: true,
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('pinned/:chatRoomId')
  @UseGuards(JwtAccessAuthGuard)
  async patchChatPinned(
    @Req() req,
    @Res() res,
    @Param('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.patchChatRoomSetting({
      email,
      chatRoomId,
      patchItem: 'isPinned',
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('leave/:chatRoomId')
  @UseGuards(JwtAccessAuthGuard)
  async leaveChatRoom(
    @Req() req,
    @Res() res,
    @Param('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    await this.chatService.LeaveChatRoom(email, chatRoomId);
    const result = await this.chatService.getChatRoomList(email);

    return res.status(200).json({ chatRoomList: result });
  }

  @Get('alarm')
  @UseGuards(JwtAccessAuthGuard)
  async getAlarmInfo(@Res() res, @Query('alarmId') alarmId: string) {
    const result = await this.chatService.getAlarmInfo(alarmId);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('blocked/user')
  @UseGuards(JwtAccessAuthGuard)
  async checkBlockedUserChats(
    @Req() req,
    @Res() res,
    @Query('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.checkBlockedUserChats(
      email,
      chatRoomId
    );

    return res.status(result.statusCode).json(result.data);
  }
}
