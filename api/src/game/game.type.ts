import { Socket } from "socket.io";

type Paddle = {
	x:	number;
	y:	number;
	height:	number;
	width:	number;
	// to remove :
	socket: Socket;
	active: boolean;
}

type Ball = {
	speed:	number;
	x:		number;
	y:		number;
	radius:	number;
	velocityX:	number;
	velocityY:	number;
}

export { Paddle, Ball }
