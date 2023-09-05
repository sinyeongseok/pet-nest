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

  @Patch('allam/:chatRoomId')
  @UseGuards(JwtAccessAuthGuard)
  async patchChatAllam(
    @Req() req,
    @Res() res,
    @Param('chatRoomId') chatRoomId: string
  ) {
    const email = req.user.email;
    const result = await this.chatService.patchChatRoomAllam(email, chatRoomId);

    return res.status(result.statusCode).json(result.data);
  }
}
