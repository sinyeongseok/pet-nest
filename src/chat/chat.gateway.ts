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

  @SubscribeMessage('chat-list')
  async handleGetChatList(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'chat-list',
        data: { chatRoomId, token },
      });

      return;
    }

    const result = await this.chatService.getChatList(
      validateTokenResult.user.email,
      chatRoomId
    );

    socket.emit('chat-list', {
      statusCode: 200,
      message: '성공',
      data: { chatList: result },
    });

    return { success: true, data: { chatList: result } };
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
