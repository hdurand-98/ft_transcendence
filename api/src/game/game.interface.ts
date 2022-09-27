// import { Socket } from 'dgram';
import { Socket } from 'socket.io';
import { User } from '../user/user.entity';
import type { Paddle, Ball } from './game.type';
export type { Paddle, Ball} from './game.type'
import { UserModule } from '../user/user.module';
import { MatchHistory } from './game.entity';


interface Player extends User
{
    x: number;
    y: number;
}

interface velocity
{
    x: number;
    y: number;
}
//export interface Ball
//{
//    speed: number;
//    x: number;
//    y: number;
//    // velocity: velocity;
//    radius: number;
//    velocityX: number;
//    velocityY: number;
//}

interface Canvas
{
    width: string;
    height: string;
}

export interface Match
{
    id: string;
    canvas: Canvas;
    ball :Ball;
    player_1: Player;
    player_2: Player;
    x: number;
    y: number;
    watcher : User;
    modeSpecial: boolean;

}
export interface dataFront {
    player1_paddle_y: number;
    player1_paddle2_y: number;
    player2_paddle_y: number;
    player2_paddle2_y: number;
    ball_x: number;
    ball_y: number;
}

//export interface Paddle {
//    x : number;
//    y : number;
//    height : number;
//    width : number;
//    socket : Socket;
//    active: boolean;
//}

export interface Names {
    p1_name : string;
    p2_name : string;
}

export interface Scores {
    p1 : number;
    p2 : number;
}

//export interface matchParameters {
//    dataFront: dataFront,
//    ball: Ball,
//    p1_socket: Socket,
//    p1_paddle: Paddle,
//    p1_paddle_spe: Paddle,
//    p2_socket: Socket,
//    p2_paddle: Paddle,
//    p2_paddle_spe: Paddle,
//    loop_stop: NodeJS.Timer,
//    p1_dir: direction,
//    p1_dir_spe: direction
//    p2_dir: direction,
//    p2_dir_spe: direction,
//    names: Names,
//    score: Scores,
//    isSpeMode: boolean
//}

type matchParameters = {
    id: string,
    dataFront: dataFront,
    ball: Ball,
    p1_socket: Socket,
    p1_paddle: Paddle,
    p1_paddle_spe: Paddle,
    p2_socket: Socket,
    p2_paddle: Paddle,
    p2_paddle_spe: Paddle,
    loop_stop: NodeJS.Timer,
    P1_MoveUP: boolean,
    P1_MoveUP_pad2: boolean,
    P1_MoveDOWN: boolean,
    P1_MoveDOWN_pad2: boolean,
    P2_MoveUP: boolean,
    P2_MoveUP_pad2: boolean,
    P2_MoveDOWN: boolean,
    P2_MoveDOWN_pad2: boolean,
    names: Names,
    score: Scores,
    isSpeMode: boolean,
    players_ready: number
}

export type { matchParameters }
