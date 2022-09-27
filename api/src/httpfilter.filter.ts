import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import  {Request, Response} from 'express';


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
	  const request = ctx.getRequest<Request>();

	  let status;
	  if (exception instanceof HttpException)
		  exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
