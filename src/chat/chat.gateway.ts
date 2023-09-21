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
import { BoardService } from 'src/board/board.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private tokenService: TokenService,
    private boardService: BoardService
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

    socket.userEmail = email;

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
    socket.userEmail = email;
    const result = await this.chatService.getChatRoomList(email);

    result.forEach((res) => {
      socket.join(String(res.id));
    });

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

    socket.join(chatRoomId);

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

  private async broadcastChatList(sockets, chatRoomId) {
    for await (const socket of sockets) {
      const userSocket: any = this.nsp.sockets.get(socket);
      const getChatListresult = await this.chatService.getChatList(
        userSocket.userEmail,
        chatRoomId
      );

      userSocket.emit('chat-list', {
        statusCode: 200,
        message: '성공',
        data: { chatList: getChatListresult },
      });
    }
  }

  private async broadcastChatRoomList(sockets) {
    for await (const socket of sockets) {
      const userSocket: any = this.nsp.sockets.get(socket);
      const getChatRoomListresult = await this.chatService.getChatRoomList(
        userSocket.userEmail
      );

      userSocket.emit('room-list', {
        statusCode: 200,
        message: '성공',
        data: { chatRoomList: getChatRoomListresult },
      });
    }
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

    await this.chatService.createMessage({
      chatRoomId,
      message,
      sender: validateTokenResult.user.email,
    });

    const room = this.nsp.adapter.rooms.get(chatRoomId);
    const sockets = Array.from(room);

    await Promise.all([
      this.broadcastChatList(sockets, chatRoomId),
      this.broadcastChatRoomList(sockets),
    ]);

    return { success: true };
  }

  @SubscribeMessage('leave')
  async handleChatRoomLeave(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'leave',
        data: { chatRoomId, token },
      });

      return;
    }

    const email = validateTokenResult.user.email;

    await this.chatService.LeaveChatRoom(email, chatRoomId);
    socket.leave(chatRoomId);

    const chatRoomList = await this.chatService.getChatRoomList(email);

    socket.emit('room-list', {
      statusCode: 200,
      message: '성공',
      data: { chatRoomList },
    });

    return { success: true };
  }

  @SubscribeMessage('alarm')
  async handleChatRoomSettingAlarm(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'alarm',
        data: { chatRoomId, token },
      });

      return;
    }

    const email = validateTokenResult.user.email;

    const chatRoomSettingResult =
      await this.chatService.patchChatRoomSettingHeader({
        email,
        chatRoomId,
        patchItem: 'isAlarm',
      });

    const chatRoomList = await this.chatService.getChatRoomList(email);

    socket.emit('alarm', {
      statusCode: 200,
      message: '성공',
      data: chatRoomSettingResult.data,
    });
    socket.emit('room-list', {
      statusCode: 200,
      message: '성공',
      data: { chatRoomList },
    });

    return { success: true };
  }

  @SubscribeMessage('blocked')
  async handleBlockedUser(
    @ConnectedSocket() socket,
    @MessageBody() { blockedBy, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'blocked',
        data: { blockedBy, token },
      });

      return;
    }

    const email = validateTokenResult.user.email;
    await this.chatService.blockedUser(email, blockedBy);
    const chatRoomList = await this.chatService.getChatRoomList(email);

    socket.emit('room-list', {
      statusCode: 200,
      message: '성공',
      data: { chatRoomList },
    });

    return { success: true };
  }

  @SubscribeMessage('schedule')
  async handleCreateSchedule(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, promiseAt, alarmTime, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'schedule',
        data: { chatRoomId, promiseAt, alarmTime, token },
      });

      return;
    }

    await this.chatService.createUsedItemSchedule({
      chatRoomId,
      promiseAt,
      alarmTime,
    });

    const room = this.nsp.adapter.rooms.get(chatRoomId);
    const sockets = Array.from(room);

    socket.emit('create-schedule', {
      statusCode: 200,
      message: '성공',
      data: { isCreate: true },
    });

    await Promise.all([
      this.broadcastChatList(sockets, chatRoomId),
      this.broadcastChatRoomList(sockets),
    ]);

    return { success: true };
  }

  @SubscribeMessage('patch-used-item-status')
  async handlePatchStatusUsedItemBoard(
    @ConnectedSocket() socket,
    @MessageBody() { chatRoomId, usedItemBoardId, status, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'patch-used-item-status',
        data: { usedItemBoardId, status, token },
      });

      return;
    }

    await this.boardService.changeBoardStatus(usedItemBoardId, status);

    const room = this.nsp.adapter.rooms.get(chatRoomId);
    const sockets = Array.from(room);

    for await (const socket of sockets) {
      const userSocket: any = this.nsp.sockets.get(socket);
      const result = await this.chatService.getProvideUsedTradingInfo(
        chatRoomId
      );

      userSocket.emit('get-chat/used-item', {
        statusCode: 200,
        message: '성공',
        data: { usedItemInfo: result },
      });
    }

    return { success: true };
  }

  @SubscribeMessage('delete-schedule')
  async handleDeleteSchedule(
    @ConnectedSocket() socket,
    @MessageBody() { scheduleId, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'delete-schedule',
        data: { scheduleId, token },
      });

      return;
    }

    const result = await this.chatService.deleteSchedule(scheduleId);
    const room = this.nsp.adapter.rooms.get(result);
    const sockets = Array.from(room);

    await Promise.all([
      this.broadcastChatList(sockets, result),
      this.broadcastChatRoomList(sockets),
    ]);

    return { success: true };
  }

  @SubscribeMessage('patch-schedule')
  async handlePatchSchedule(
    @ConnectedSocket() socket,
    @MessageBody() { scheduleId, promiseAt, alarmTime, token }
  ) {
    const validateTokenResult = await this.tokenService.validateToken(token);

    if (validateTokenResult.statusCode !== 200) {
      socket.emit('error', {
        ...validateTokenResult,
        url: 'patch-schedule',
        data: { scheduleId, promiseAt, alarmTime, token },
      });

      return;
    }

    const result = await this.chatService.updateUsedItemSchedule({
      scheduleId,
      promiseAt,
      alarmTime,
    });
    const room = this.nsp.adapter.rooms.get(result);
    const sockets = Array.from(room);

    await this.broadcastChatList(sockets, result);

    return { success: true };
  }
}
