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

  @SubscribeMessage('join-room')
  @UseGuards(JwtAccessAuthGuard)
  async handlejoinRoom(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId }
  ) {
    const email = socket.user.email;

    socket.id = email;

    if (socket.rooms.has(chatRoomId)) {
      return;
    }

    socket.join(chatRoomId);

    return;
  }

  @SubscribeMessage('create-room/used-item')
  @UseGuards(JwtAccessAuthGuard)
  async handleCreateRoom(
    @ConnectedSocket() socket,
    @MessageBody() { sellerEmail, usedItemBoardId }
  ) {
    const email = socket.user.email;

    const createChatRoomResult = await this.chatService.createChatRoom(
      [email, sellerEmail],
      usedItemBoardId
    );

    socket.join(createChatRoomResult.id);
    this.nsp.emit('create-room/used-item', {
      chatRoomId: createChatRoomResult.id,
    });

    return { success: true, data: { chatRoomId: createChatRoomResult.id } };
  }

  @SubscribeMessage('get-chat/used-item')
  @UseGuards(JwtAccessAuthGuard)
  async handleGetProvideUsedTradingInfo(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId }
  ) {
    const result = await this.chatService.getProvideUsedTradingInfo(chatRoomId);

    this.nsp.emit('get-chat/used-item', {
      usedItemInfo: result,
    });

    return { success: true, data: { usedItemInfo: result } };
  }

  @SubscribeMessage('room-list')
  @UseGuards(JwtAccessAuthGuard)
  async handleRoomList(@ConnectedSocket() socket) {
    const email = socket.user.email;

    const result = await this.chatService.getChatRoomList(email);
    this.nsp.emit('get-room-list', { chatRoomList: result });

    return { success: true, data: { chatRoomList: result } };
  }

  @SubscribeMessage('message')
  @UseGuards(JwtAccessAuthGuard)
  async handleSendMessage(
    @ConnectedSocket() socket,
    @MessageBody() { message, chatRoomId }
  ) {
    const email = socket.user.email;
    const result = await this.chatService.createMessage({
      chatRoomId,
      message,
      sender: email,
    });

    this.nsp.to(chatRoomId).emit('message', { messageInfo: result });

    return { success: true, data: { messageInfo: result } };
  }
}
