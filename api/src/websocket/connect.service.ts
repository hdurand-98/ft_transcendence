import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { JwtService, JwtVerifyOptions } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { FortyTwoAuthStrategy } from "../auth/fortyTwo/fortyTwo.strategy";
import { jwtConstants } from "../auth/jwt/jwt.constants";
import { JwtPayload } from "../auth/payload.type";
import { Channel } from "../channel/channel.entity";
import { ChannelService } from "../channel/channel.service";
import { FriendshipsService } from "../friendships/friendships.service";
import { MessageService } from "../message/message.service";
import { User } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { WSServer } from "./wsserver.gateway";



@Injectable()
export class ConnectService {

	constructor(
		protected readonly jwtService: JwtService,
		protected readonly userService: UserService,
		protected readonly channelService: ChannelService,
		protected readonly messageService: MessageService,
		protected readonly friendService: FriendshipsService,
		@Inject(forwardRef(() => WSServer)) protected gateway: WSServer
	) { }

	private all_users : User[];

	/**
	 * Validate if the connection has a cookie and that this cookie is valid
	 * @param client new socket
	 * @returns user if everything correct
	 */
	async validateConnection(client: Socket): Promise<User> {
		try {
			const authCookies: string[] = client.handshake.headers.cookie.split('; ');
			const authCookie: string[] = authCookies.filter(s => s.includes('Authentication='));
			const authToken = authCookie[0].substring(15, authCookie[0].length);
			const jwtOptions: JwtVerifyOptions = {
				secret: jwtConstants.secret
			}
			const jwtPayload: JwtPayload = await this.jwtService.verify(authToken, jwtOptions);
			const user: User = await this.userService.getUserByIdentifierLight(jwtPayload.sub);
			return user;
		} catch (err) {
			return null;
		}
	}

	/**
	 * First function called when new connection is handle. Check if user is valid,
	 * add in map `active_user` and send users lists to all client
	 * @param client Socket of the client who try to connect
	 * @returns nothing
	 */
	async handleConnection(client: Socket) {
		const user = await this.validateConnection(client);
		if (!user)
			return this.handleDisconnect(client);
		client.data.user = user;
		this.all_users = await this.userService.getUsers();
		if (!this.gateway.activeUsers.has(user)) {
			this.gateway.activeUsers.set(user, client);
		}

		for (const [u, sock] of this.gateway.activeUsers.entries()){
			if (!this.gateway.server.sockets.sockets.has(sock.id))
			{
				this.gateway.activeUsers.delete(u);
			}
		}

		this.gateway.activeUsers.forEach((socket: Socket) => {
			this.gateway.server.to(socket.id).emit(
				'listUsers',
				this.listConnectedUser(socket, this.all_users, false)
			);
		});

		const chan: Channel[] = await this.userService.getChannelsForUser(user);
		for (const c of chan) {
			client.join(c.name);
		}

	}

	/**
	 * Remove client from map `active_user`
	 * @param client client who disconnected
	 */
	handleDisconnect(client: Socket) {
		if (client.data.user)
		{
			for (const entries of this.gateway.activeUsers.keys())
			{
				if (entries.id == client.data.user.id)
				{
					this.gateway.activeUsers.delete(entries);
					break;
				}
			}
		}

		for (const [u, sock] of this.gateway.activeUsers.entries()){
			if (!this.gateway.server.sockets.sockets.has(sock.id))
			{
				this.gateway.activeUsers.delete(u);
			}
		}

		this.gateway.activeUsers.forEach((socket: Socket) => {
			this.gateway.server.to(socket.id).emit(
				'listUsers',
				this.listConnectedUser(socket, this.all_users, false)
			);
		});
		client.emit('bye');
		client.disconnect(true);
	}


	public listConnectedUser(client: Socket, all_users: User[], withCurrentUser: boolean = true) {
		const data: User[] = [];
		let i = 0;

		for (const user of this.gateway.activeUsers.keys()) {
			user.status = "online";
			if (client.data.user.id == user.id && withCurrentUser) {
				data[i] = user;
				i++;
			}
			else if (client.data.user.id != user.id) {
				data[i] = user;
				i++;
			}
		}
		if (all_users)
		{
			for (const user of all_users)
			{
				if (!data.find(element => element.id == user.id) && client.data.user.id != user.id)
				{
					user.status = "offline";
					data[i] = user;
					i++;
				}
			}
		}
		return (data);
	}

	getUserList(client: Socket) {

		this.gateway.server.to(client.id).emit(
			'listUsers',
			this.listConnectedUser(client, this.all_users, false)
		);
	}

	async refreshUsers(client : Socket)
	{
		const u : User = await this.userService.getUserByIdentifier(client.data.user.id);
		for (const entries of this.gateway.activeUsers.keys()) {
			if (entries.id == client.data.user.id) {
				this.gateway.activeUsers.delete(entries);
				this.gateway.activeUsers.set(await this.userService.getUserByIdentifier(client.data.user.id), client);
				break;
			}
		}
		for (const [user, socket] of this.gateway.activeUsers) {
			this.getUserList(socket);
		}
		this.gateway.server.to(client.id).emit('toUpdate');
	}
}
