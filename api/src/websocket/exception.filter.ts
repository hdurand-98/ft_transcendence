import { ArgumentsHost, BadRequestException, Catch, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from "socket.io";
import { QueryFailedError } from "typeorm";


@Catch(WsException, HttpException, QueryFailedError)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
	catch(exception: WsException | HttpException | QueryFailedError, host: ArgumentsHost) {

		const client = host.switchToWs().getClient() as Socket;
		const data = host.switchToWs().getData();
		let error : string | object;
		if (exception instanceof WsException)
			error = exception.getError()
		else if (exception instanceof BadRequestException) // pour les DTO
		{
			error = exception.getResponse();
			if (typeof (error) == 'object')
				error = JSON.parse(JSON.stringify(error)).message[0]; // a chaque fois on prend juste le premier pour assurere un meilleur formatage
		}
		else if (exception instanceof HttpException)
			error = exception.getResponse();
		else if (exception instanceof QueryFailedError)
			error = "Query failed : " + exception.message;
		client.emit("error", { event: error, data: data })
	}
}


