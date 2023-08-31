import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
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
}
