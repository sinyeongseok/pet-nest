import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { ChatService } from './chat.service';
import { Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}
  @WebSocketServer() nsp: Namespace;

  @SubscribeMessage('create-room-used-item')
  @UseGuards(JwtAccessAuthGuard)
  async handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { sellerEmail, usedItemBoardId },
    @Req() req
  ) {
    const email = req.user.email;

    const createChatRoomResult = await this.chatService.createChatRoom(
      [email, sellerEmail],
      usedItemBoardId
    );

    socket.join(createChatRoomResult.id);
    this.nsp.emit('create-room', createChatRoomResult.id);

    return { success: true, data: { chatRoomId: createChatRoomResult.id } };
  }
}
