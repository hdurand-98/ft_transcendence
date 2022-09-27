import { forwardRef, Inject, Injectable, Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../auth/guards/ws-auth.guard';
import { ChannelService } from '../channel/channel.service';
import { addToPrivateRoomDto } from '../dtos/addToPrivateRoom.dto';
import { banUserDto } from '../dtos/banUser.dto';
import { ModifyChannelDto } from '../dtos/modifyChannel.dto';
import { muteUserDto } from '../dtos/muteUser.dto';
import { newChannelDto } from '../dtos/newChannel.dto';
import { sendChannelMessageDto } from '../dtos/sendChannelMessageDto.dto';
import { sendPrivateMessageDto } from '../dtos/sendPrivateMessageDto.dto';
import { FriendshipsService } from '../friendships/friendships.service';
import { GameRelayService } from '../game/game.logic';
import { MessageService } from '../message/message.service';
import { GameService } from '../game/game.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';
import { ConnectService } from './connect.service';
import { WebsocketExceptionsFilter } from './exception.filter';

@Injectable()
@UseFilters(new WebsocketExceptionsFilter())
@WebSocketGateway()
export class WSServer implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer()
	public _server : Server;

	constructor(
		protected readonly jwtService: JwtService,
		protected readonly userService: UserService,
		protected readonly channelService: ChannelService,
		protected readonly messageService: MessageService,
		protected readonly friendService: FriendshipsService,
		protected readonly gameService: GameService,
		@Inject(forwardRef(() => GameRelayService)) protected readonly gameRelayService : GameRelayService,
		@Inject(forwardRef(() => ChatService)) protected readonly chatService : ChatService,
		@Inject(forwardRef(() => ConnectService)) protected readonly connectService : ConnectService
	) { }


	protected logger: Logger = new Logger('WebSocketServer');
	protected all_users: User[];
	protected active_users = new Map<User, Socket>();
	protected users = [];

	get server(): Server {
		return this._server;
	}

	get activeUsers(): Map<User, Socket> {
		return this.active_users;
	}

	/*
	**
	** 	 ██████  ██████  ███    ██ ███    ██ ███████  ██████ ████████
	** 	██      ██    ██ ████   ██ ████   ██ ██      ██         ██
	** 	██      ██    ██ ██ ██  ██ ██ ██  ██ █████   ██         ██
	** 	██      ██    ██ ██  ██ ██ ██  ██ ██ ██      ██         ██
	** 	 ██████  ██████  ██   ████ ██   ████ ███████  ██████    ██
	**
	*/

	protected async validateConnection(client: Socket): Promise<User> {
		return this.connectService.validateConnection(client);
	}

	/**
	 * Handle first connection from WebSocket. Can't use Guard on this
	 * So we validate directly on the function
	 * @param client Socket initialized by client
	 * @returns Nothing, but handle disconnection if problems occurs
	 */
	async handleConnection(client: Socket) {
		this.connectService.handleConnection(client);
	}

	async afterInit() {
		this.logger.log("Start listenning");
		await this.chatService.init();
	}

	/**
	 * Handle Socket disconnection.
	 * @param client Socket received from client
	 */
	async handleDisconnect(client: Socket) {
		this.connectService.handleDisconnect(client);
		this.gameRelayService.handleDisconnect(client);
	}

	/**
	 * Return a JSON object with all active user. With or without the user who made the request
	 * regarding of `withCurrentUser` parameters
	 * @param client user who made the request
	 * @param active_user map of active user
	 * @param withCurrentUser if true user who made the request will be included
	 * @returns
	 */
	protected listConnectedUser(client: Socket, all_users: User[], withCurrentUser: boolean = true) {
		this.connectService.listConnectedUser(client, all_users, withCurrentUser);
	}


	/**
	 * @brief get all users
	 * @param client
	 */
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('getUsers')
	async get_users_list(client: Socket)
	{
		this.connectService.getUserList(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('refreshUsers')
	async refreshUsers(client : Socket)
	{
		this.connectService.refreshUsers(client);
	}

	/*
	** 		_____ _    _       _______    _____       _______ ________          __ __     __
	** 	  / ____| |  | |   /\|__   __|  / ____|   /\|__   __|  ____\ \        / /\\ \   / /
	** 	 | |    | |__| |  /  \  | |    | |  __   /  \  | |  | |__   \ \  /\  / /  \\ \_/ /
	** 	 | |    |  __  | / /\ \ | |    | | |_ | / /\ \ | |  |  __|   \ \/  \/ / /\ \\   /
	** 	 | |____| |  | |/ ____ \| |    | |__| |/ ____ \| |  | |____   \  /\  / ____ \| |
	** 	  \_____|_|  |_/_/    \_\_|     \_____/_/    \_\_|  |______|   \/  \/_/    \_\_|
	**
	*/

	/*
	**
	** ██████   ██████   ██████  ███    ███ ███████
	** ██   ██ ██    ██ ██    ██ ████  ████ ██
	** ██████  ██    ██ ██    ██ ██ ████ ██ ███████
	** ██   ██ ██    ██ ██    ██ ██  ██  ██      ██
	** ██   ██  ██████   ██████  ██      ██ ███████
	**
	**
	** Rooms (by event name)
	** ├─ getRooms
	** ├─ createRooms
	** ├─ joinRoom
	** ├─ deleteRoom
	** ├─ leaveRoom
   	** ├─ banUser
	** ├─ muteUser
	** ├─ setAdmin
  	** ├─ modifyChanSettings
	*/

	@SubscribeMessage('getRooms')
	@UseGuards(WsJwtAuthGuard)
	async getRooms() {
		await this.chatService.getRooms();
	}

	/**
	 *
	 * @param client
	 * @param channel
	 * @returns
	 */
	@SubscribeMessage('createRoom')
	@UseGuards(WsJwtAuthGuard)
	@UsePipes(ValidationPipe)
	async createRoom(client: Socket, channel: newChannelDto) {
		await this.chatService.createRoom(client, channel)
	}

	/**
	 *
	 * @param client
	 * @param channel
	 * @returns
	 */
	@SubscribeMessage('joinRoom')
	@UseGuards(WsJwtAuthGuard)
	@UsePipes(ValidationPipe)
	async onJoinRoom(client: Socket, joinRoom: newChannelDto) {
		await this.chatService.joinRoom(client, joinRoom);
	}

	/**
	 * @brief delete room for current user : check if channel owner
	 * @param client
	 * @param channel
	 * @returns
	 */
	@SubscribeMessage('deleteRoom')
	@UseGuards(WsJwtAuthGuard)
	async onDeletedRoom(client: Socket, channel: string) {
		await this.chatService.deleteRoom(client, channel);
	}

	/**
	 * @brief leave room for current user
	 * @param client
	 * @param channel by string
	 * @returns
	 */
	@SubscribeMessage('leaveRoom')
	@UseGuards(WsJwtAuthGuard)
	async onLeaveRoom(client: Socket, channel: string) {
		await this.chatService.leaveRoom(client, channel)
	}

	@SubscribeMessage('addUser')
	@UseGuards(WsJwtAuthGuard)
	@UsePipes(ValidationPipe)
	async onAddUser(client: Socket, data : addToPrivateRoomDto) {
		await this.chatService.addUser(client, data)
	}

	@SubscribeMessage('banUser')
	@UsePipes(ValidationPipe)
	async onBanUser(client: Socket, data : banUserDto) {
		await this.chatService.ban(client, data);
	}

	@SubscribeMessage('muteUser')
	@UsePipes(ValidationPipe)
	async onMuteUser(client: Socket, data : muteUserDto) {
		await this.chatService.mute(client, data);
	}

	@SubscribeMessage('setAdmin')
	async onSetAdmin(client: Socket, data : { channel: string, toSetAdmin: User }) {
		await this.chatService.setAdmin(client, data);
	}

	@SubscribeMessage('modifyChanSettings')
	async onsetOrUnsetPass(client: Socket, channelSettings : ModifyChannelDto) {
		await this.chatService.modifyChanSettings(client, channelSettings);
	}

	/*
	**
	** ███    ███ ███████  ██████  ███████
	** ████  ████ ██      ██       ██
	** ██ ████ ██ ███████ ██   ███ ███████
	** ██  ██  ██      ██ ██    ██      ██
	** ██      ██ ███████  ██████  ███████
	**
	**
	** Messages
	** ├─ [ Private messages ]
	** │  ├─ privateMessage (send private message)
	** │  ├─ getPrivateMessage
	** ├─ [ Channel messages ]
	** │  ├─ sendChannelMessages
	** │  ├─ getChannelMessages
	*/

	/**
	 * Each time someone want to emit/receive a private message, this function is called
	 *
	 * @brief emit the PM to both the sender and emitter
	 * @param client
	 * @param msg
	 * @returns
	 */
	@SubscribeMessage('privateMessage')
	@UseGuards(WsJwtAuthGuard)
	@UsePipes(ValidationPipe)
	async onPrivateMessage(client: Socket, msg: sendPrivateMessageDto) {
		await this.chatService.sendPrivateMessage(client, msg)
	}

	/**
	 * @brief Get Private Messages between two users
	 * @param client
	 * @param user2
	 * @returns
	 */
	@SubscribeMessage('getPrivateMessage')
	@UseGuards(WsJwtAuthGuard)
	async onGetPrivateMessage(client: Socket, user2: User){
		await this.chatService.getPrivateMessages(client, user2);
	}

	/**
	 * @brief Send Channel Messages
	 * @param client
	 * @param data an object containing : chan (string) and msg (string)
	 */
	@SubscribeMessage('sendChannelMessages')
	@UsePipes(ValidationPipe)
	@UseGuards(WsJwtAuthGuard)
	async onSendChannelMessages(client: Socket, data: sendChannelMessageDto) {
		await this.chatService.sendChannelMessage(client, data)
	}

	/**
	 * @brief get Channel Messages
	 * @param client
	 * @param channelName
	 * @returns
	 */
	@SubscribeMessage('getChannelMessages')
	@UseGuards(WsJwtAuthGuard)
	async onGetChannelMessages(client: Socket, channelName: string) {
		await this.chatService.getChannelMessages(client, channelName);
	}

	/*
	**
	** ███████ ██████  ██ ███████ ███    ██ ██████  ███████
	** ██      ██   ██ ██ ██      ████   ██ ██   ██ ██
	** █████   ██████  ██ █████   ██ ██  ██ ██   ██ ███████
	** ██      ██   ██ ██ ██      ██  ██ ██ ██   ██      ██
	** ██      ██   ██ ██ ███████ ██   ████ ██████  ███████
	**
	**
	** Friends
	** ├─ addFriend
	** ├─ acceptFriend
	** ├─ removeFriend
	** ├─ getFriends
	** ├─ getFriendRequests
	*/

	/**
	 * @brief add friend
	 * @param client
	 * @param friend
	 */
	@SubscribeMessage('addFriend')
	@UseGuards(WsJwtAuthGuard)
	async addFriend(client: Socket, friend: User) {
		await this.chatService.addFriend(client, friend);
	}

	/**
	 * @brief Accept friendship - status goes from "pending" to "accepted"
	 * @param client
	 * @param friend
	 */
	@SubscribeMessage('acceptFriend')
	@UseGuards(WsJwtAuthGuard)
	async acceptFriendRequest(client: Socket, friend: User) {
		await this.chatService.acceptFriendRquest(client, friend);
	}


	/**
	 * @brief Remove a friend
	 * @param client
	 * @param friend
	 */
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('removeFriend')
	async removeFriend(client: Socket, friend: User) {
		await this.chatService.removeFriend(client, friend);
	}

	/**
	 * @brief Get friends of the client
	 * @param client
	 */
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('getFriends')
	async getFriends(client: Socket) {
		await this.chatService.getFriends(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('getFriendRequests')
	async getFriendRequests(client: Socket) {
		await this.chatService.getFriendRequests(client);
	}

	/*
	**
	** ██████  ██       ██████   ██████ ██   ██
	** ██   ██ ██      ██    ██ ██      ██  ██
	** ██████  ██      ██    ██ ██      █████
	** ██   ██ ██      ██    ██ ██      ██  ██
	** ██████  ███████  ██████   ██████ ██   ██
	**
	**
    ** Block
	**	├─ block
	**	├─ unblock
	**
	*/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('block')
	async block(client: Socket, toBlock: User) {
		await this.chatService.block(client, toBlock);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('unblock')
	async unblock(client: Socket, toUnBlock: User) {
		await this.chatService.unblock(client, toUnBlock)
	}

	/*
	**  ██████   █████  ███    ███ ███████      ██████   █████  ████████ ███████ ██     ██  █████  ██    ██
	**██       ██   ██ ████  ████ ██          ██       ██   ██    ██    ██      ██     ██ ██   ██  ██  ██
	**██   ███ ███████ ██ ████ ██ █████       ██   ███ ███████    ██    █████   ██  █  ██ ███████   ████
	**██    ██ ██   ██ ██  ██  ██ ██          ██    ██ ██   ██    ██    ██      ██ ███ ██ ██   ██    ██
	** ██████  ██   ██ ██      ██ ███████      ██████  ██   ██    ██    ███████  ███ ███  ██   ██    ██
	**
	**
	**	Game
	**	├─ getInQueue
	**	├─ joinGame
	**	├─ startMatch
	**	├─ GameOnGoing
	**	├─ watchGame
	**	├─ inviteToPlay
	**	├─ changingTab
	*/
	/**
	 * @brief Random matchmaking
	 * @param client Socket
	 * @param mode
	 * @returns
	 */

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('game_inQueue')
	async getInQueue(client : Socket, mode: number) {
		await this.gameRelayService.getInQueue(client, mode)
	}

	/**
	 * @brief Matchmaking with a friend
	 * @param client
	 * @param playerId
	 * @param mode
	 */
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('joinGame')
	async joinGame(client: Socket, data : {friendId : string, mode : string} ) {
		const isAvailable = await this.gameRelayService.InviteJoinGame(data.friendId);
		if (isAvailable == true)
		{
			this.gameRelayService.go_to_game(client);
			await this.gameRelayService.joinGame(client, data)
		}
		else
			throw new WsException('Your friend is already playing.');
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('game_start')
	startMatch(client : Socket) {
		this.gameRelayService.start_gameloop(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('WatchGame')
	watchGame(client: Socket, gameId: string)
	{
		this.gameRelayService.watchGame(client, gameId);
	}


	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('pending invite')
	async inviteToPlay(client: Socket, data : {friendId : string, mode : string} )
	{
		await this.gameRelayService.pendingInvite(client, data);
	}


	/**
	 * @brief get match history of a user
	 * @param client
	 */
	 @UseGuards(WsJwtAuthGuard)
	 @SubscribeMessage('get history')
	 async getHistory(client : Socket)
	 {
		 await this.gameRelayService.getMatchHistory(client);
	 }
	 /**
	 * @brief get match history of a user
	 * @param client
	 */
	  @UseGuards(WsJwtAuthGuard)
	  @SubscribeMessage('changement of tab')
	  changeTab(client : Socket)
	  {
		  this.gameRelayService.changeTab(client);
	  }

	 /**
	 * @brief get achievements list of client
	 * @param client
	 */
	  @UseGuards(WsJwtAuthGuard)
	  @SubscribeMessage('get achievements')
	  getAchievements(client : Socket)
	  {
		  this.gameRelayService.sendAchievements(client);
	  }

	@UsePipes(ValidationPipe)
	@SubscribeMessage('MoveUP2')
	MoveUp_Pad2(client : Socket)
	{
		this.gameRelayService.MoveUp2(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('MoveDOWN2')
	MoveDown_Pad2(client : Socket)
	{
		this.gameRelayService.MoveDown2(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('StopMove2')
	StopMove_Pad2(client : Socket)
	{
		this.gameRelayService.StopMove2(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('MoveUp')
	MoveUp(client : Socket)
	{
		this.gameRelayService.MoveUp(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('MoveDown')
	MoveDown(client : Socket)
	{
		this.gameRelayService.MoveDown(client);
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('StopMove')
	StopMove(client : Socket)
	{
		this.gameRelayService.StopMove(client);
	}

}
