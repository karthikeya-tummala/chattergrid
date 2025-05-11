import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  users = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log('User-joined: ', client.id);
    client.broadcast.emit('user-join', `User joined with id ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.users.delete(client.id);
    console.log('User-left: ', this.users.get(client.id));
    client.broadcast.emit('user-left', `User left with id ${client.id}`);
  }

  @SubscribeMessage('set-username')
  handleSetUsername(client: Socket, username: string) {
    if ([...this.users.values()].includes(username)) {
      client.emit('username-exists', 'Username not available');
      return;
    }
    this.users.set(client.id, username);
    console.log(`User with id ${client.id} set to username ${username}`);

    this.server.emit('username-registered', `${client.id} is now ${username}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, message: string) {
    const username = this.users.get(client.id) || 'Anonymous';
    console.log(username, ': ', message);
    this.server.emit('new-message', { username, message });
  }
}
