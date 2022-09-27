import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { AchievementsService } from "../achievements/achievements.service";
import { User } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { ChatService } from "../websocket/chat.service";
import { WSServer } from "../websocket/wsserver.gateway";
import type { matchParameters } from "../game/game.interface";
import type { Paddle } from "../game/game.interface";
import { MatchHistory } from "./game.entity";
import { GameService } from "./game.service";


@Injectable()
export class GameRelayService {

	constructor(
		protected readonly userService: UserService,
		protected readonly gameService: GameService,
		protected readonly achivementService: AchievementsService,

		@Inject(forwardRef(() => ChatService)) protected readonly chatservice: ChatService,
		@Inject(forwardRef(() => WSServer)) protected gateway: WSServer
	) { }

	private clientMatchmaking = new Array<Socket>();
	private clientMatchmakingSpecial = new Array<Socket>();
	private	pendingInviteUser = new Map<User, string>();
	private	pendingInviteUserSpecial = new Map<User, string>();
	// Store current match, key is the match id
	private currentMatch = new Map<string, matchParameters>();

	private VICTORY: number = 5;

	/*  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
		██░▄▀▄░█░▄▄▀█▄▄░▄▄██░▄▄▀██░██░██░▄▀▄░█░▄▄▀██░█▀▄█▄░▄██░▀██░██░▄▄░
		██░█░█░█░▀▀░███░████░█████░▄▄░██░█░█░█░▀▀░██░▄▀███░███░█░█░██░█▀▀
		██░███░█░██░███░████░▀▀▄██░██░██░███░█░██░██░██░█▀░▀██░██▄░██░▀▀▄
		▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ */

	/**
	 * Handle matchmaking. Had to corresponding array a player. When two player are waiting in the same
	 * room, they are removed from the array and game is launched.
	 * @param client User who join matchmaking queue
	 * @param mode 1 if single pallet, 2 if one pallet
	 */
	public async getInQueue(client: Socket, mode: number): Promise<void> {
		if (mode === 1) {
			if (this.clientMatchmaking.indexOf(client) === -1) {
				this.clientMatchmaking.push(client);
			}
			if (this.clientMatchmaking.length >= 2) {
				const [p1, p2] = this.clientMatchmaking.splice(0, 2);
				await this.startMatch(p1, p2, false);
			}
		}
		if (mode === 2) {
			if (this.clientMatchmakingSpecial.indexOf(client) === -1) {
				this.clientMatchmakingSpecial.push(client);
			}
			if (this.clientMatchmakingSpecial.length >= 2) {
				const [p1, p2] = this.clientMatchmakingSpecial.splice(0, 2);
				await this.startMatch(p1, p2, true);
			}
		}
	}

	public async	pendingInvite(client: Socket, data: {friendId: string, mode: string}) {
		if (data.mode == "1") {
			this.pendingInviteUser.set(client.data.user, data.friendId);
		}
		else if (data.mode == "2") {
			this.pendingInviteUserSpecial.set(client.data.user, data.friendId);
		}
		const	friend = await this.userService.getUserByIdentifier(data.friendId);
		const	friendSocket = await this.chatservice.findSocketId(friend)
		this.gateway.server.to(friendSocket.id).emit('accept invite', client.data.user.id, data.mode);
	}

	public async	InviteJoinGame(friendId: string): Promise<boolean> {
		const	friend = await this.userService.getUserByIdentifier(friendId);
		const	friendSocket = await this.chatservice.findSocketId(friend);

		if (	!this.getClientMatch(friendSocket)
			&&	this.clientMatchmakingSpecial.indexOf(friendSocket) === -1
			&&	this.clientMatchmaking.indexOf(friendSocket) === -1) {
				this.gateway.server.to(friendSocket.id).emit('enter_room');
				return (true);
			}
		return (false);
	}

	public async	joinGame(client: Socket, data: {friendId: string, mode: string}) {
		const	friend: User = await this.userService.getUserByIdentifier(data.friendId);
		const	friendSocket: Socket = await this.chatservice.findSocketId(friend);
		if (data.mode == "1") {
			this.startMatch(client, friendSocket, false);
		}
		else {
			this.startMatch(client, friendSocket, true);
		}
	}

	public	go_to_game(client: Socket) {
		this.gateway.server.to(client.id).emit('enter_room');
	}

	public	changeTab(client: Socket) {
		this.handleDisconnect(client);
	}

	public	handleDisconnect(client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match) {
			if (client === match.p1_socket)
			{
				this.set_winner(match, 2, client, true);
			}
			else if (client === match.p2_socket)
			{
				this.set_winner(match, 1, client, true);
			}
			else
			{
				this.gateway.server.to(client.id).emit('leave_queue');
				client.leave(match.id);
			}
		}
		else if (this.clientMatchmaking.indexOf(client) !== -1) {
			this.clientMatchmaking.splice(this.clientMatchmaking.indexOf(client), 1);
		}
		else if (this.clientMatchmakingSpecial.indexOf(client) !== -1) {
			this.clientMatchmakingSpecial.splice(this.clientMatchmakingSpecial.indexOf(client), 1);
		}
		this.gateway.server.to(client.id).emit('leave_queue');
	}

	private init_match(p1: Socket, p2: Socket, id: string, specialMode: boolean): matchParameters {
		const param: matchParameters = <matchParameters>{
			id: id,
			dataFront: {
				player1_paddle2_y: 0,
				player1_paddle_y: 0,
				player2_paddle2_y: 0,
				player2_paddle_y: 0,
				ball_x: 0,
				ball_y: 0,
			},
			ball: {
				radius: 1,
				speed: 1,
				velocityX: .5,
				velocityY: .5,
				x: 100,
				y: 50,
			},
			p1_socket: p1,
			p1_paddle: {
				x: 2,
				y: 50,
				height: 10,
				width: 2,
			},
			p1_paddle_spe: {
				x: 40,
				y: 50,
				height: 10,
				width: 2,
			},
			p2_socket: p2,
			p2_paddle: {
				x: 200 - 2 - 2,
				y: 50,
				height: 10,
				width: 2,
			},
			p2_paddle_spe: {
				x: 200 - 40 - 2,
				y: 50,
				height: 10,
				width: 2,
			},
			score: {
				p1: 0,
				p2: 0,
			},
			names: {
				p1_name: p1.data.user.name,
				p2_name: p2.data.user.name,
			},
			isSpeMode: specialMode,
			players_ready: 0,
		};

		return param;
	}

	private async startMatch(player1: Socket, player2: Socket, specialMode: boolean) {
		const match: MatchHistory = await this.gameService.createMatch(player1.data.user, player2.data.user);
		const param: matchParameters = this.init_match(player1, player2, match.id, specialMode);
		this.currentMatch.set(
			match.id,
			param
		);
		player1.join(match.id);
		player2.join(match.id);
		this.gateway.server.to(match.id).emit('set_names', param.names);
		this.gateway.server.to(match.id).emit('game_countdownStart', specialMode);
	}

	private collision(match: matchParameters, player: Paddle): boolean {
		const pad_top = player.y;
		const pad_bottom = player.y + player.height;
		const pad_left = player.x;
		const pad_right = player.x + player.width;

		const ball_top = match.ball.y - match.ball.radius;
		const ball_bottom = match.ball.y + match.ball.radius;
		const ball_left = match.ball.x - match.ball.radius;
		const ball_right = match.ball.x + match.ball.radius;

		return (
			pad_left < ball_right &&
			pad_top < ball_bottom &&
			pad_right > ball_left &&
			pad_bottom > ball_top
		);
	}

	private getClientMatch(client: Socket): matchParameters {
		for (const room of client.rooms) {
			const tmp: matchParameters = this.currentMatch.get(room);
			if (tmp) {
				return (tmp);
			}
		}
		for (const [, match] of (this.currentMatch.entries()))
		{
			if (match.p1_socket.id == client.id || match.p2_socket.id == client.id)
				return match;
		}
		return (null);
	}

	public start_gameloop(client: Socket) {
		const match: matchParameters = this.getClientMatch(client);
		if (match.players_ready === 1) {
			match.players_ready++;
			this.getOngoingMatches();
			match.loop_stop = setInterval(() => this.loop(match), 1000 / 60);
		}
		else {
			match.players_ready++;
		}
	}

	private resetBall(param: matchParameters) {
		param.ball.speed = 1;
		param.ball.velocityX = .5;
		param.ball.velocityY = .5;
		param.ball.x = 100;
		param.ball.y = 50;
	}

	private loop(param: matchParameters) {
		this.getOngoingMatches();
		if (param.ball.x - param.ball.radius < 0) {
			param.score.p2++;
			this.gateway.server.to(param.id).emit('update_score', false);
			if (param.score.p2 >= this.VICTORY) {
				this.set_winner(param, 2)
			}
			else {
				this.resetBall(param);
			}
		}
		else if (param.ball.x + param.ball.radius > 200) {
			param.score.p1++;
			this.gateway.server.to(param.id).emit('update_score', true);
			if (param.score.p1 >= this.VICTORY) {
				this.set_winner(param, 1);
			}
			else {
				this.resetBall(param);
			}
		}

		this.calculateP1Pad(param);
		this.calculateP2Pad(param);

		param.ball.x += param.ball.velocityX;
		param.ball.y += param.ball.velocityY;

		if (param.ball.y - param.ball.radius < 0)
		{
			param.ball.velocityY = -param.ball.velocityY;
			param.ball.y = 0 + param.ball.radius;
		}
		else if (param.ball.y + param.ball.radius > 100)
		{
			param.ball.velocityY = -param.ball.velocityY;
			param.ball.y = 100 - param.ball.radius;
		}

		let player: Paddle = (param.ball.x + param.ball.radius < 200 / 2) ? param.p1_paddle : param.p2_paddle;

		if (param.isSpeMode) {
			if (player === param.p1_paddle) {
				player = (param.ball.x + param.ball.radius < param.p1_paddle_spe.x) ? param.p1_paddle : param.p1_paddle_spe;
			}
			else {
				player = (param.ball.x + param.ball.radius > param.p2_paddle_spe.x + param.p2_paddle_spe.width) ? param.p2_paddle : param.p2_paddle_spe;
			}
		}

		if (this.collision(param, player)) {
			let collidePoint = (param.ball.y - (player.y + player.height / 2));
			collidePoint = collidePoint / (player.height / 2);

			const angleRad = (Math.PI / 4) * collidePoint;
			const direction = (param.ball.velocityX >= 0) ? -1 : 1;
			param.ball.velocityX = direction * param.ball.speed * Math.cos(angleRad);
			param.ball.velocityY = param.ball.speed * Math.sin(angleRad);

			param.ball.speed += 0.5;
		}
		param.dataFront.player1_paddle_y = param.p1_paddle.y;
		param.dataFront.player1_paddle2_y = param.p1_paddle_spe.y;
		param.dataFront.player2_paddle_y = param.p2_paddle.y;
		param.dataFront.player2_paddle2_y = param.p2_paddle_spe.y;
		param.dataFront.ball_x = param.ball.x;
		param.dataFront.ball_y = param.ball.y;
		this.gateway.server.to(param.id).emit('game_position', param.dataFront);
	}

	private    set_winner (match: matchParameters, winner: number, client?: Socket, giveUp? : boolean) {
		clearInterval(match.loop_stop);
        if (winner === 2) {
            match.score.p2 = this.VICTORY;
            if (giveUp)
			{
                client.to(match.id).emit('game_end', false);
				this.gateway.server.to(client.id).emit('leave_queue');
			}
            else
                this.gateway.server.to(match.id).emit('game_end', false);

        }
        else if (winner === 1) {
            match.score.p1 = this.VICTORY;
            if (giveUp)
			{
                client.to(match.id).emit('game_end', true);
				this.gateway.server.to(client.id).emit('leave_queue');
			}
            else
                this.gateway.server.to(match.id).emit('game_end', true);
        }
        this.end_game(match);
    }

	private async	end_game(match: matchParameters) {
		match.p1_socket.leave(match.id);
		match.p2_socket.leave(match.id);
		await this.gameService.endMatch({
			id: match.id,
			scoreUser1: match.score.p1,
			scoreUser2: match.score.p2
		});
		this.currentMatch.delete(match.id);
		this.getOngoingMatches();
	}

	/**
	 * MOVEMENT
	 */
	public	MoveUp (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match.p1_socket.id && client.id === match.p1_socket.id) {
			match.P1_MoveUP = true;
		}
		else if (match.p2_socket.id && client.id === match.p2_socket.id) {
			if (match.isSpeMode) {
				match.P2_MoveUP_pad2 = true;
			}
			else {
				match.P2_MoveUP = true;
			}
		}
	}

	public	MoveDown (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match.p1_socket.id && client.id === match.p1_socket.id) {
			match.P1_MoveDOWN = true;
		}
		else if (match.p2_socket.id && client.id === match.p2_socket.id) {
			if (match.isSpeMode) {
				match.P2_MoveDOWN_pad2 = true;
			}
			else {
				match.P2_MoveDOWN = true;
			}
		}
	}

	public	MoveUp2 (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match) {
			if (match.p1_socket && client.id === match.p1_socket.id) {
				match.P1_MoveUP_pad2 = true;
			}
			else if (match.p2_socket && client.id === match.p2_socket.id) {
				if (match.isSpeMode === true) {
					match.P2_MoveUP = true;
				}
				else {
					match.P2_MoveUP_pad2 = true;
				}
			}
		}
	}

	public	MoveDown2 (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match) {
			if (match.p1_socket && client.id === match.p1_socket.id) {
				match.P1_MoveDOWN_pad2 = true;
			}
			else if (match.p2_socket && client.id === match.p2_socket.id) {
				if (match.isSpeMode === true) {
					match.P2_MoveDOWN = true;
				}
				else {
					match.P2_MoveDOWN_pad2 = true;
				}
			}
		}
	}

	public	StopMove (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match) {
			if (match.p1_socket && client.id === match.p1_socket.id) {
				match.P1_MoveUP = false;
				match.P1_MoveDOWN = false;
			}
			else if (match.p2_socket && client.id === match.p2_socket.id) {
				if (match.isSpeMode) {
					match.P2_MoveDOWN_pad2 = false;
					match.P2_MoveUP_pad2 = false;
				}
				else {
					match.P2_MoveDOWN = false;
					match.P2_MoveUP = false;
				}
			}
		}
	}

	public	StopMove2 (client: Socket) {
		const match: matchParameters = this.getClientMatch(client);

		if (match) {
			if (match.p1_socket && client.id === match.p1_socket.id) {
				match.P1_MoveUP_pad2 = false;
				match.P1_MoveDOWN_pad2 = false;
			}
			else if (match.p2_socket && client.id === match.p2_socket.id) {
				if (match.isSpeMode) {
					match.P2_MoveDOWN = false;
					match.P2_MoveUP = false;
				}
				else {
					match.P2_MoveDOWN_pad2 = false;
					match.P2_MoveUP_pad2 = false;
				}
			}
		}
	}

	private	calculateP1Pad(match: matchParameters) {
		if (match.P1_MoveUP === true) {
			if (match.p1_paddle.y - 2 < 0) {
				match.p1_paddle.y = 0;
			}
			else {
				match.p1_paddle.y -= 2;
			}
		}
		if (match.P1_MoveDOWN === true) {
			if (match.p1_paddle.y + 2 > 100 - match.p1_paddle.height) {
				match.p1_paddle.y = 100 - match.p1_paddle.height;
			}
			else {
				match.p1_paddle.y += 2;
			}
		}
		if (match.isSpeMode === true) {
			if (match.P1_MoveUP_pad2 === true) {
				if (match.p1_paddle_spe.y - 2 < 0) {
					match.p1_paddle_spe.y = 0;
				}
				else {
					match.p1_paddle_spe.y -= 2;
				}
			}
			if (match.P1_MoveDOWN_pad2 === true) {
				if (match.p1_paddle_spe.y + 2 > 100 - match.p1_paddle_spe.height) {
					match.p1_paddle_spe.y = 100 - match.p1_paddle_spe.height;
				}
				else {
					match.p1_paddle_spe.y += 2;
				}
			}
		}
	}

	private	calculateP2Pad(match: matchParameters) {
		if (match.P2_MoveUP === true) {
			if (match.p2_paddle.y - 2 < 0) {
				match.p2_paddle.y = 0;
			}
			else {
				match.p2_paddle.y -= 2;
			}
		}
		if (match.P2_MoveDOWN === true) {
			if (match.p2_paddle.y + 2 > 100 - match.p2_paddle.height) {
				match.p2_paddle.y = 100 - match.p2_paddle.height;
			}
			else {
				match.p2_paddle.y += 2;
			}
		}
		if (match.isSpeMode === true) {
			if (match.P2_MoveUP_pad2 === true) {
				if (match.p2_paddle_spe.y - 2 < 0) {
					match.p2_paddle_spe.y = 0;
				}
				else {
					match.p2_paddle_spe.y -= 2;
				}
			}
			if (match.P2_MoveDOWN_pad2 === true) {
				if (match.p2_paddle_spe.y + 2 > 100 - match.p2_paddle_spe.height) {
					match.p2_paddle_spe.y = 100 - match.p2_paddle_spe.height;
				}
				else {
					match.p2_paddle_spe.y += 2;
				}
			}
		}
	}

	/**
	 * WATCH MODE
	 */
	public async	getOngoingMatches() {
		this.gateway.server.emit('ActivesMatches', await this.gameService.listGameOngoing());
	}

	public watchGame (client: Socket, gameId: string) {
		const match: matchParameters = this.currentMatch.get(gameId);
		if (match) {
			client.join(gameId);
			this.gateway.server.to(client.id).emit('set_names', match.names);
			this.gateway.server.to(client.id).emit('set_mode', match.isSpeMode);
			this.gateway.server.to(client.id).emit('set_scores', match.score);
		}
	}

	/**
	 * MATCH HISTORY
	 */
	public async	getMatchHistory(client: Socket) {
		this.gateway.server.to(client.id).emit(
			'MatchHistory',
			await this.gameService.getAllMatchesofUser(client.data.user)
		);
	}

	public async	sendAchievements(client: Socket) {
		this.gateway.server.to(client.id).emit(
			'Achievements',
			await this.achivementService.getAchievements(client.data.user)
		);
	}

}
