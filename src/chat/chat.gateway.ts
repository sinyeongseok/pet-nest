import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { ChatService } from './chat.service';
import { TokenService } from 'src/token/token.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private tokenService: TokenService
  ) {}
  @WebSocketServer() nsp: Namespace;

  @SubscribeMessage('join-room')
  async handlejoinRoom(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'join-room',
        data: { chatRoomId, token },
      });

      return;
    }

    const email = validateTokenResult.user.email;

    socket.id = email;

    socket.emit('join-room', {
      statusCode: 200,
      message: '성공',
      data: { isJoinRoom: true },
    });

    if (socket.rooms.has(chatRoomId)) {
      return;
    }

    socket.join(chatRoomId);

    return;
  }

  @SubscribeMessage('create-room/used-item')
  async handleCreateRoom(
    @ConnectedSocket() socket,
    @MessageBody() { sellerEmail, usedItemBoardId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'create-room/used-item',
        data: {
          sellerEmail,
          usedItemBoardId,
          token,
        },
      });

      return;
    }

    const email = validateTokenResult.user.email;

    const createChatRoomResult = await this.chatService.createChatRoom(
      [email, sellerEmail],
      usedItemBoardId
    );

    socket.join(createChatRoomResult.id);
    socket.emit('create-room/used-item', {
      statusCode: 201,
      message: '성공',
      data: { chatRoomId: createChatRoomResult.id },
    });

    return { success: true, data: { chatRoomId: createChatRoomResult.id } };
  }

  @SubscribeMessage('get-chat/used-item')
  async handleGetProvideUsedTradingInfo(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'get-chat/used-item',
        data: { chatRoomId, token },
      });

      return;
    }

    const result = await this.chatService.getProvideUsedTradingInfo(chatRoomId);

    socket.emit('get-chat/used-item', {
      statusCode: 200,
      message: '성공',
      data: { usedItemInfo: result },
    });

    return { success: true, data: { usedItemInfo: result } };
  }

  @SubscribeMessage('room-list')
  async handleRoomList(@ConnectedSocket() socket, @MessageBody() { token }) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'room-list',
        data: { token },
      });

      return;
    }

    const email = validateTokenResult.user.email;

    const result = await this.chatService.getChatRoomList(email);
    socket.emit('room-list', {
      statusCode: 200,
      message: '성공',
      data: { chatRoomList: result },
    });

    return { success: true, data: { chatRoomList: result } };
  }

  @SubscribeMessage('message')
  async handleSendMessage(
    @ConnectedSocket() socket,
    @MessageBody() { message, chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'message',
        data: { message, chatRoomId, token },
      });

      return;
    }

    const email = validateTokenResult.user.email;
    const result = await this.chatService.createMessage({
      chatRoomId,
      message,
      sender: email,
    });

    this.nsp.to(chatRoomId).emit('message', {
      statusCode: 200,
      message: '성공',
      data: { messageInfo: result },
    });

    return { success: true, data: { messageInfo: result } };
  }
}
